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
					<p><a id="install-btn" class="btn btn-primary btn-lg" href="<?= $PLATFORM_PACKAGES[0]['href']; ?>">Install app</a></p>
					<small>Version <em><?= $PLATFORM_PACKAGES[0]['version']; ?></em> for <?= $PLATFORM_NAME; ?></small>
				</div>
			</div>
			<div id="pane-standby">
				<p>This message will automatically go away when the plug-in is installed.</p>
				<br />
				<div class="webapi-instructions">
					<ol>
					<?php
					if (strtolower($USER['browser']) == 'chrome') {
					?>
						<li>Click the file at the lower-left of your browser window <strong><?= $PLATFORM_PACKAGES[0]['name']; ?></strong>.</li>
					<?php
					} else if ((strtolower($USER['browser']) == 'firefox') && (strtolower($PLATFORM) == "macintosh")) {
					?>
						<li>Double-click <strong><?= $PLATFORM_PACKAGES[0]['name']; ?></strong> in the Download window (press Command-J if the window isn’t open).</li>
					<?php
					} else if ((strtolower($USER['browser']) == 'firefox') && (strtolower($PLATFORM) == "windows")) {
					?>
						<li>Double-click <strong><?= $PLATFORM_PACKAGES[0]['name']; ?></strong> in the Download window (press Ctrl-J if the window isn’t open).</li>
					<?php
					} else if (strtolower($USER['browser']) == 'firefox') {
					?>
						<li>Double-click <strong><?= $PLATFORM_PACKAGES[0]['name']; ?></strong> in the Download window (press Shift-Ctrl-Y if the window isn’t open).</li>
					<?php
					} else if (strtolower($USER['browser']) == 'safari') {
					?>
						<li>Double-click <strong><?= $PLATFORM_PACKAGES[0]['name']; ?></strong> in the Download window (If the window isn’t open, press Option-Command-L).</li>
					<?php
					} else if (strtolower($USER['browser']) == 'msie') {
					?>
						<li>Click <strong>Run</strong> to the message in the bottom of the screen to launch the installer <?= $PLATFORM_PACKAGES[0]['name']; ?>.</li>
					<?php
					}
					?>
						<li>Follow the on-screen instructions to install the CernVM WebAPI app.</li>
					</ol>
				</div>
				<p class="footer-label"><a target="_blank" href="<?= $PLATFORM_PACKAGES[0]['href']; ?>">Click here to retry the download if it failed.</a></p>
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