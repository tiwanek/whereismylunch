__author__ = 'Tomasz Iwanek'

import subprocess

from flask.ext.script import Manager
from whereismylunch.db import db, __all_models__
from whereismylunch.wiml import app, main

manager = Manager(app)

@manager.command
def createdb():
    """
    Create applicaton database.
    """
    db.init('whereismylunch.db')
    db.connect()
    db.create_tables(__all_models__)
    db.close()

@manager.command
def runserver():
    """
    Run applicaton server.
    """
    main()

@manager.command
def runtests():
    subprocess.call(["python3", "-m", "whereismylunch.tests"])

if __name__ == '__main__':
    manager.run()