'use strict';

import {Injectable} from "@angular/core";
import {Http, Headers, Request} from '@angular/http';

var cookies = (function() {
	var session_id; //cookies doesn't work with Android Default Browser / Ionic
	return {
		delete_sessionId: function() {
			session_id = null;
			document.cookie  = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		},
		get_sessionId: function () {
			return document.cookie.split('; ')
			.filter(function (x) { return x.indexOf('session_id') === 0; })
			.map(function (x) { return x.split('=')[1]; })
			.pop() || session_id || "";
		},
		set_sessionId: function (val) {
			document.cookie = 'session_id=' + val;
			session_id = val;
		}
	};
}());

@Injectable()
export class odooService {
	errorInterceptors : any = [];
	context: any;
	uniq_id_counter: number = 0;
	constructor(public http: Http) {
	}
	/**
	* login
	*		update cookie (session_id) in both cases
	* @return promise
	*		resolve promise if credentials ok
	*		reject promise if credentials ko (with {title: wrong_login})
	*		reject promise in other cases (http issues, server error)
	*/
	login(login, password) {
		var params = {
			login: login,
			password: password
		};
		var self = this;
		return self.http.get('/web/login', {withCredentials: true}).toPromise().then(function (odooLogin) {
			var body = odooLogin.text();
			const parser = new DOMParser();
			var parsed = parser.parseFromString(body, 'text/html');
			var input = parsed.querySelector('form');
			var csrf = input["csrf_token"].value;
			var data = 
			encodeURIComponent("login") + '=' + encodeURIComponent(login) + '&' +
			encodeURIComponent("password") + '=' + encodeURIComponent(password) + '&' +
			encodeURIComponent("csrf_token") + '=' + encodeURIComponent(csrf);

;
			return self.sendRequest(odooLogin.url, {},  {
				'method' : 'POST',
				'url' : odooLogin.url,
				'body' : data,
				'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
			});
		});
	}

	/**
	* logout
	* @return promise
	*/
	logout() {
		return this.sendRequest('/web/session/destroy',{});
	}

	/**
	* check if logged in or not
	* @return promise
	*
	*/
	isLoggedIn() {
		return this.getSessionInfo().then(function (result) {
			return !!(result.uid);
		});
	}
	searchRead(model, domain, fields) {
		var params = {
			model: model,
			domain: domain,
			fields: fields
		}
		return this.sendRequest('/web/dataset/search_read', params);
	}
	getSessionInfo() {
		return this.sendRequest('/web/session/get_session_info', {});
	}

	getServerInfo() {
		return this.sendRequest('/web/webclient/version_info', {});
	}
	
	callJson(service, method, args) {
		var params = {
			service: service,
			method: method,
			args: args,
		};
		return this.sendRequest('/jsonrpc', params);
	}
	call(model, method, args, kwargs) {

		kwargs = kwargs || {};
		kwargs.context = kwargs.context || {};
		Object.assign(kwargs.context, {'lang': 'fr_FR'});

		var params = {
			model: model,
			method: method,
			args: args,
			kwargs: kwargs,
		};
		return this.sendRequest('/web/dataset/call_kw', params);
	}
	/**
	* base function
	*/
	sendRequest(url, params, forceReq=undefined) {
		console.log('send request', url, params);
		/** (internal) build request for $http
		* keep track of uniq_id_counter
		*/
		function buildRequest(url, params) {
			self.uniq_id_counter += 1;
			var headers = {
				'Content-Type': 'application/json',
			}

			var json_data = {
				jsonrpc: '2.0',
				method: 'call',
				params: params, //payload
			};
			return {
				'method' : 'POST',
				'url' : url,
				'body' : JSON.stringify(json_data),
				'headers': headers,
				'id': ("r" + self.uniq_id_counter),
			};
		}

		/** (internal) Odoo do some error handling and doesn't care
		* about HTTP response code
		* catch errors codes here and reject
		*	@param response $http promise
		*	@return promise
		*		if no error : response.data ($http.config & header stripped)
		*		if error : reject with a custom errorObj
		*/
		function handleOdooErrors(response) {
			var errorObj = {
				title: '',
				message:'',
				fullTrace: '',
			};
			var error;
			var ct = response.headers.get('Content-Type');
			if (ct.startsWith("text/html")) {
				var url = new URL(response.url);
				if(response.status === 200) {
					if ('/web/login' == url.pathname) {
						errorObj.title = "Not Logged";
						errorObj.message = "Not logged";				
					} else {	
						//no error
						return response.text();
					}
				} else {
					errorObj.title = "Unkown Error";
					errorObj.message = "Mal formatted return from server";	
				}
			} else if (ct.startsWith("application/json")) {
				error = response.json().error;
				errorObj["fullTrace"] = error;
				if (!error) {
					// no error
					return response.json().result;
				}
				if (error.code == 100) {
					if (error.data.name === "odoo.http.SessionExpiredException") {
						errorObj.title ='SessionExpired';
						errorObj.message = error.data.message;
						cookies.delete_sessionId();
					}
				} else if (error.code == 200) {
					if (error.data.name === "odoo.exceptions.AccessError") {
						errorObj.title = 'AccessError';
						errorObj.message = error.data.message;	
					} else if (error.data.name === "odoo.exceptions.UserError") {
						errorObj.title = 'UserError';
						errorObj.message = error.data.message;
                    } else if (error.data.name === "odoo.exceptions.ValidationError") {
                        errorObj.title = 'ValidationError';
                        errorObj.message = error.data.message;
					} else if (error.data.name === "werkzeug.exceptions.NotFound") {
						errorObj.title = 'page_not_found';
						errorObj.message = 'HTTP Error';	
					}
				}
			}
			console.error(errorObj);
			self.errorInterceptors.forEach(function (i) {
				i(errorObj);
			});
			console.log("on throw une promise rejected")
			return Promise.reject(errorObj)
		}

		/**
		*	(internal)
		*	catch HTTP response code (not handled by Odoo ie Error 500, 404)
		*	@params $http rejected promise
			*	@return promise
		*/
		function handleHttpErrors(reason) {
			var errorObj = {title:'http', fullTrace: reason, message:'HTTP Error'};
			self.errorInterceptors.forEach(function (i) {
				i(errorObj);
			});
			return Promise.reject(errorObj);
		}

		/**
		*	(internal) wrapper around $http for handling errors and build request
		*/
		function http(url, params, forceReq) {
			var req;
			if (forceReq) {
				req = forceReq;
			} else {
				req = buildRequest(url, params);
			}
			var headers = new Headers(req.headers);
			var obj = {
				url: req.url,
				method: req.method,
				headers: headers,
				body: req.body
			}
			var request = new Request(obj);
			return self.http.request(request)
				.toPromise()
				.then(handleOdooErrors, handleHttpErrors)
		}

		var self = this;
		return http(url, params, forceReq);
	}


};
