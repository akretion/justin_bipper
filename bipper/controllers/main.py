import json
from werkzeug.utils import redirect

from odoo import http, registry
from odoo.http import request


class Justin(http.Controller):

    @http.route('/justin', type='http', auth="public")
    def justin(self, **kw):
        return redirect("/justin/static/src/index.html")