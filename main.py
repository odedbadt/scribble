import datetime

from flask import Flask, render_template
from flask import request

app = Flask(__name__)

@app.route("/list_models")
def list_models():
    client = Client()
    bucket = client.get_bucket('polyhedra-museum.appspot.com')
    blob_names = [bl.name.split('/')[-1].replace('.json', '') for bl in bucket.list_blobs()]
    return blob_names

@app.route("/model")
def load_model():
    model_name = request.args.get('model_name')
    client = Client()
    bucket = client.get_bucket('polyhedra-museum.appspot.com')
    blob = bucket.get_blob(f'models/{model_name}.json')
    if blob is None:
        return 'Shape not found', 404
    data = blob.download_as_string()
    return data



# @app.route("/")
# def root():
#     # For the sake of example, use static information to inflate the template.
#     # This will be replaced with real information in later steps.
#     return render_template("main_screen.html")
@app.route("/qs")
def root_qs():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("drive_quickstart.html")

@app.route("/")
def root():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    return render_template("main_screen.html")


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
