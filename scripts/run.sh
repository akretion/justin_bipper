#!/bin/bash

# declare vars
_ODOO_PROXY_URL=${BIPPER_ODOO_PROXY_URL}


if [[ ! -z $_ODOO_PROXY_URL ]]; then 
  sed -i.bak "s/odoo.olst.io./$_ODOO_PROXY_URL/g" /etc/nginx/sites-available/bipper.conf
else
  echo "BIPPER_ODOO_PROXY_URL not set, using default value"
fi;

# start nginx process
nginx -g "daemon off;"



