<!DOCTYPE html>
<html lang="en">
	<head>
		<title>CernVM WebAPI Installer</title>
		<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
		<script type="text/javascript" src="js/jquery-2.1.0.min.js"></script>
		<script type="text/javascript" src="js/bootstrap.min.js"></script>
		<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
		<link rel="stylesheet" type="text/css" href="css/page.css">
		<style type="text/css">
		.btn-group-vertical {
			max-width: 100%;
		}
		</style>
	</head>
	<body>
		<div class="container-fluid text-center">
			<br />
			<h1 class="webapi-header"><img src="img/icon-cernvm.png" alt="CernVM Logo" /> CernVM <span>WebAPI</span></h1>
			<div id="pane-install">
				<p>You need to install the CernVM WebAPI app to get started.</p>
				<br />
				<div class="webapi-well well">
					<div class="content">
						<div class="btn-group-vertical" role="group">
							<?php
							foreach ($PLATFORM['list'] as $li) {

								// Use href if specified
								if (isset($li['href'])) {
									echo '<a class="btn btn-default" target="_blank" href="'.$li['href'].'">'.$li['title'].'</a>';

								} else {

									// Match files for this list item
									$m_files = filter_files( $FILES, $li['match_files'] );

									// Pick disabled class
									if (count($m_files) == 0) {
										echo '<a class="install-btn btn btn-primary disabled" href="#">'.$li['title'].'</a>';
									} else {
										echo '<a class="install-btn btn btn-primary" href="'.$m_files[0]['href'].'">'.$li['title'].'</a>';
									}

								}

							}
							?>
						</div>
					</div>
					<small>Version <em><?= $FILES[0]['version']; ?></em> for <?= $PLATFORM['title']; ?></small>
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
				<p class="footer-label"><a target="_blank" href="<?= $FILES[0]['href']; ?>">Click here to retry the download if it failed.</a></p>
			</div>
			<div class="webapi-footer">
				<a href="http://cernvm.cern.ch/portal" target="_blank">Learn more information about the CernVM technology</a>
			</div>
		</div>
		<?php
		if ($BROWSER['group'] == 'msie') {
		?> 
			<script type="text/vbscript" language="vbscript">
			Sub LaunchInstaller(FileName As String)
				Dim Installer
				Set Installer = CreateObject("WindowsInstaller.Installer")
				Installer.InstallProduct "http://labs.wavesoft.gr/webapi/"+FileName, ""
			End Sub
			</script>
			<script type="text/javascript" language="javascript">
			$("#pane-standby").hide();
			$(".install-btn").click(function(e) {
				try {
					LaunchInstaller($(this).attr('href'));
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
			$(".install-btn").click(function() {
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