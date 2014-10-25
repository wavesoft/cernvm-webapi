import json
from util.vmcp import VMCPSigner
from flask import Flask
from flask import request 

# Create a Flask application
app = Flask(__name__)

# Create a signer instance
signer = VMCPSigner( "res/test-local.pem" )

# Machine configuration
MACHINE_CONFIG = {
    'name' : 'My first VM',
    'secret' : 'pr0t3ct_this',
    'userData' : "[amiconfig]\nplugins=cernvm\n[cernvm]\nusers=user:users:user\n",
    'ram' : 128,
    'cpus' : 1,
    'disk' : 1024,
    'flags': 0x31
}

@app.route("/vmcp")
def vmcp_sign():
    return json.dumps( signer.sign( MACHINE_CONFIG, request.args.get('cvm_salt') ) )

@app.route("/")
def hello():
    return app.send_static_file('index.html')

if __name__ == "__main__":
    app.run(debug=True)
