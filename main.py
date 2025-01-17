import datetime

from flask import Flask, render_template
from flask import request

app = Flask(__name__)

@app.route("/")
def root():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("main_screen.html", dbg=False)

@app.route("/dbg")
def dbg():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("main_screen.html", dbg=True)

@app.route("/p")
def dp():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("p")

@app.route("/v")
def dpv():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("p")
if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
