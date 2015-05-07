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
					<p><a id="install-btn" class="btn btn-primary btn-lg" href="<?php echo $FILES[0]['href']; ?>">Install app</a></p>
					<small>Version <em><?php echo $FILES[0]['version']; ?></em> for <?php echo $PLATFORM['title']; ?></small>
				</div>
			</div>
			<div id="pane-standby">
				<p>This message will automatically go away when the plug-in is installed.</p>
				<br />
				<div class="webapi-instructions">
					<ol>
					<?php
					foreach ($BROWSER['guidelines'] as $msg) {

						// Replace filename
						$msg = str_replace('%', $FILES[0]['name'], $msg);

						// Render li
						echo "						<li>$msg</li>\n";

					}
					?>
					</ol>
				</div>
				<p class="footer-label"><a target="_blank" href="<?php echo $FILES[0]['href']; ?>">Click here to retry the download if it failed.</a></p>
			</div>
			<div class="webapi-footer">
				<a href="http://cernvm.cern.ch/portal" target="_blank">Learn more information about the CernVM technology</a>
			</div>
		</div>
		<?php
		if ($BROWSER['group'] == 'msie') {
		?> 
			<script type="text/vbscript" language="vbscript">
			Sub LaunchInstaller()
				Dim Installer
				Set Installer = CreateObject("WindowsInstaller.Installer")
				Installer.InstallProduct "http://labs.wavesoft.gr/webapi/<?php echo $FILES[0]['href']; ?>", ""
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