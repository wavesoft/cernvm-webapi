<!DOCTYPE html>
<html lang="en">
	<head>
		<title>CernVM WebAPI Installer</title>
		<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
		<script type="text/javascript" src="js/jquery-2.1.0.min.js"></script>
		<script type="text/javascript" src="js/bootstrap.min.js"></script>
		<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
		<link rel="stylesheet" type="text/css" href="css/page.css">
	</head>
	<body>
		<div class="container-fluid text-center">
			<br />
			<h1 class="webapi-header"><img src="img/icon-cernvm.png" alt="CernVM Logo" /> CernVM <span>WebAPI</span></h1>
			<p>You need to install the CernVM WebAPI plugin to get started.</p>
			<br />
			<div class="webapi-well alert alert-danger">
				<p>The CernVM WebAPI Plugin is currently not availble on the <strong><?= $PLATFORM['title']; ?></strong> platform.</p>
			</div>
			<div class="webapi-message">
				<br />
				<p><a href="https://github.com/wavesoft/cernvm-webapi#building">You can still build it from sources if you like</a></p>
			</div>

			<div class="webapi-footer">
				<a href="http://cernvm.cern.ch/portal" target="_blank">Learn more information about the CernVM technology</a>
			</div>
		</div>
	</body>
</html>