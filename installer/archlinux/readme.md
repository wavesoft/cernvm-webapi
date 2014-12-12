Archlinux
=========
If order to participate to the challenge on Archlinux, you'll need `virtualbox` and `cernvm-webapi`.

1. Install `virtualbox` and its kernel module as root.

		# pacman -S virtualbox
		# pacman -S virtualbox-host-modules

	* If you have a custom kernel, you'll need to build the kernel module yourself.

			# pacman -S virtualbox-host-dkms
			# dkms install vboxhost/$(pacman -Q virtualbox|awk '{print $2}'|sed 's/\-.\+//') -k $(uname -rm|sed 's/\ /\//')

2. In order to detect the hypervisor, the module must be loaded. Load the `vboxdrv` module.

		# modprobe vboxdrv

	For more information about virtualbox on Archlinux, please visit the [wiki](https://wiki.archlinux.org/index.php/VirtualBox).

3. Build `cernvm-webapi`. An [AUR package](https://aur.archlinux.org/packages/cernvm-webapi) is available. Build it as a normal user. You might need to install the dependencies with `pacman`.

		$ wget https://aur.archlinux.org/packages/ce/cernvm-webapi/cernvm-webapi.tar.gz
		$ tar -zxvf cernvm-webapi.tar.gz
		$ cd cernvm-webapi
		$ makepkg

	For more information about AUR on Archlinux, please visit the [wiki](https://wiki.archlinux.org/index.php/Arch_User_Repository).

4. Install `cernvm-webapi`. If everything when well, the package should be created and you only need to install it as root.

		# pacman -U cernvm-webapi-*

5. Start `cernvm-webapi`, it can be run as a normal user even thought it is going to ask for root access.

		$ cernvm-webapi

6. Now go to the [CERN Challenge](http://test4theory.cern.ch/vlhc/) and you should all setup. Happy collision!
