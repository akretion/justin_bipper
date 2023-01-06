import json
from werkzeug.utils import redirect

from odoo import http, registry
from odoo.http import request


class Bipper(http.Controller):

    @http.route('/bipper', type='http', auth="public")
    def bipper(self, **kw):
        return redirect("/bipper/static/src/index.html")
