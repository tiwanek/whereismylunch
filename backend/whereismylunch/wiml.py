__author__ = 'Tomasz Iwanek'

import datetime
import os
import json
import socket

from flask import Flask, g
from flask.ext.cors import CORS

from whereismylunch.api import bapi
from whereismylunch.db import db
from whereismylunch.session import bsession

my_address = socket.gethostbyname(socket.gethostname())

CONFIG_PYFILE = "config.py"

app = Flask(__name__)
app.register_blueprint(bapi)
app.register_blueprint(bsession)


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default()

app.json_encoder = CustomJSONEncoder

# as flask_restful kindly ignores my encoder
app.config['RESTFUL_JSON'] = {'cls': CustomJSONEncoder}

cors = CORS(app, resources={"/*": {"origins": ["http://127.0.0.1:8000", "http://%s:8000" % my_address,
                                               "https://127.0.0.1:8000", "https://%s:8000" % my_address]}})

def open_db(name):
    database = getattr(g, '_database', None)
    if database is None:
        database = db
        database.init(name)
        database.connect()
    return database

@app.teardown_appcontext
def teardown_db(exception):
    database = getattr(g, '_database', None)
    if database is not None:
        database.close()

def main():
    config = os.getcwd() + os.path.sep + CONFIG_PYFILE
    if os.path.exists(config):
        app.config.from_pyfile(config)
    with app.app_context():
        open_db('whereismylunch.db')
    app.run(host="0.0.0.0")

if __name__ == '__main__':
    main()
