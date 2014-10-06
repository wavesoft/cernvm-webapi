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
		<div class="container-fluid">
			<h1 class="webapi-header"><img src="img/icon-cernvm.png" alt="CernVM Logo" /> CernVM <span>WebAPI</span></h1>
			<p>This website is using the <a href="http://cernvm.cern.ch/portal/webapi" target="_blank">CernVM WebAPI technology</a> which allows a website to communicate with a <a href="http://en.wikipedia.org/wiki/Virtual_Machine" target="_blank">Virtual Machine</a> in your computer.
			</p>

			<div class="alert alert-danger">
				There is currently no installer available for your current platform (<?= $PLATFORM; ?>)! Please try again in the near future.
			</div>
			<div>
				If you think this is an error, pick one of the following installers that match best your platform:
				<ul class="nav nav-pills nav-stacked">
					<li><a href="packages/cvmwebapi-2.0.0.pkg"> <img border="0" src="img/icon-pkg.png" alt="PKG Icon" /> CernVM WebAPI 2.0.0 (x86_64) for OSX</a> </li>
				</ul>
			</div>

		</div>
	</body>
</html>