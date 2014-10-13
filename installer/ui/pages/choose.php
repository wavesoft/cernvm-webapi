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
			<div id="pane-install">
				<p>You need to install the CernVM WebAPI app to get started.</p>
				<br />
				<div class="webapi-well well">
					<?php 

					?>
					<p>We could not detect your platform?</p>
					<div class="btn-group">
						<a href="?plaf=windows" class="btn btn-lg btn-default"><img style="width:32px" src="img/plaf-windows.png" alt="Windows" /></a>
						<a href="?plaf=macintosh" class="btn btn-lg btn-default"><img style="width:32px" src="img/plaf-macintosh.png" alt="Macintosh" /></a>
						<a href="?plaf=linux" class="btn btn-lg btn-default"><img style="width:32px" src="img/plaf-linux-generic.png" alt="Linux" /></a>
					</div>
				</div>
			</div>
			<div id="pane-standby">

			</div>
			<div class="webapi-footer">
				<a href="http://cernvm.cern.ch/portal" target="_blank">Learn more information about the CernVM technology</a>
			</div>
		</div>
		<?php
		if (strtolower($USER['browser']) == 'msie') {
		?> 
			<script type="text/vbscript" language="vbscript">
			Sub LaunchInstaller()
				Dim Installer
				Set Installer = CreateObject("WindowsInstaller.Installer")
				Installer.InstallProduct "http://labs.wavesoft.gr/webapi/<?= $PLATFORM_PACKAGES[0]['href']; ?>", ""
			End Sub
			</script>
			<script type="text/javascript" language="javascript">
			$("#pane-standby").hide();
			$("#install-btn").click(function(e) {
				try {
					LaunchInstaller();
					e.stopPropagation();
					e.preventDefault();
				} catch (e) {
					$("#pane-install").fadeOut(function() {
						$("#pane-standby").fadeIn();
					});
				}
			});
			</script>
		<?php
		} else {
		?>
			<script type="text/javascript">
			$("#pane-standby").hide();
			$("#install-btn").click(function() {
				$("#pane-install").fadeOut(function() {
					$("#pane-standby").fadeIn();
				});
			});
			</script>
		<?php
		}
		?>
	</body>
</html>