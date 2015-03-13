
import hashlib
import base64
import urllib

class _crypto_M2Crypto:
	"""
	[Cryptographic Routines Implementation]
	Using M2Crypto Libraries (Tricky to build, but fast)

	Installable using: `pip install m2crypto`
	"""
	def __init__( self, pkey ):
		# Try to load M2Crypto
		import M2Crypto
		self.rsa = M2Crypto.RSA.load_key( pkey )

	def sign( self, payload ):
		# Calculate the digest of the payload
		digest = hashlib.new('sha512', payload).digest()
		# Sign and return
		return base64.b64encode( self.rsa.sign(digest, "sha512") )

class _crypto_PyCrypto:
	"""
	[Cryptographic Routines Implementation]
	Using PyCrypto Libraries (Relatevely easy to build and fast)

	Installable using: `pip install pycrypto`
	"""
	def __init__( self, pkey ):
		# Try to load PyCrypto libraries
		import Crypto.Hash.SHA512 as SHA512
		import Crypto.PublicKey.RSA as RSA
		import Crypto.Signature.PKCS1_v1_5 as PKCS1_v1_5
		self.SHA512 = SHA512
		# Open and read key file
		with open(pkey, 'r') as f:
			# Create an RSA key
			rsa = RSA.importKey(f.read())
			# Create a PKCS1 signer
			signer = PKCS1_v1_5.new(rsa)
			# Return the signer instance
			self.signer = signer

	def sign( self, payload ):
			# Calculate the digest of the payload
			digest = self.SHA512.new(payload)
			# Sign and return
			return base64.b64encode( self.signer.sign(digest) )

class _crypto_rsa:
	"""
	[Cryptographic Routines Implementation]
	Using RSA Python Library (Pure python code, but slower)

	Installable using: `pip install rsa`
	"""
	def __init__( self, pkey ):
		# Try to load rsa library
		import rsa
		print "Using rsa"
		self.rsa = rsa
		# Open and read key file
		with open(pkey, 'r') as f:
			# Create an RSA key
			self.key = rsa.PrivateKey.load_pkcs1(f.read())

	def sign( self, payload ):
		# Sign and return
		return base64.b64encode( self.rsa.sign(payload, self.key, "SHA-512") )

class VMCPSigner:
	"""
	VMCP Signer Class

	This class provides the cryptographic helper routine 'sign' which is used
	to sign a set of key/value parameters with a predefined private key.

	This class automaticaly tries to find various RSA implementations already
	installed in your system, including M2Crypto, PyCrypto and RSA libraries.

	Usage:

	```python
	from vmcp import VMCPSigner
	
	# Create an instance to the VMCP signer
	signer = VMCPSigner('path/to/private_key.pem')
	
	# Sign a set of key/value parameters using a
	# salt provided by CernVM WebAPI
	parameters = signer.sign({ "disk": "1024" }, request.get('cvm_salt'))

	```
	"""

	def __init__(self, private_key="res/test-local.pem"):
		"""
		Create a VMCP signer that uses the specified private key
		"""
		# Try various cryptographic providers until we find something
		self.crypto = None
		for p in (_crypto_M2Crypto, _crypto_PyCrypto, _crypto_rsa):
			try:
				self.crypto = p(private_key)
				break
			except ImportError:
				continue
			except IOError as e:
				raise IOError("Could not load private key from '%s' (%s)" % (private_key, str(e)))

		# Check if it was not possible to instantiate a provider
		if not self.crypto:
			raise IOError("Could not find an RSA library in your installation!")

	def sign(self, parameters, salt):
		"""
		Calculate the signature for the given dictionary of parameters
		and unique salt.

		This function use the reference for calculating the VMCP signature
		from https://github.com/wavesoft/cernvm-webapi/wiki/Calculating-VMCP-Signature .

		It returns a new dictionary, having the 'signature' key populated with
		the appropriate signature.
		"""

		# Validate parameters
		if type(parameters) != dict:
			raise IOError("Expecting dictionary as parameters!")

		# Create the buffer to be signed, 
		# following the specifications
		# ------------------------------------
		# 1) Sort keys
		strBuffer = ""
		for k in sorted(parameters.iterkeys()):

			# 2) Handle the BOOL special case
			v = parameters[k]
			if type(v) == bool:
				if v:
					v=1
				else:
					v=0
				parameters[k] = v

			# 3) URL-Encode values
			# 4) Represent in key=value\n format
			strBuffer += "%s=%s\n" % ( str(k).lower(), urllib.quote(str(v),'~') )

		# 5) Append Salt
		strBuffer += salt
		# ------------------------------------

		# Create a copy so we don't touch the original dict
		parameters = parameters.copy()

		# Store the resulting signature to the parameter
		parameters['signature'] = self.crypto.sign( strBuffer )
		return parameters


