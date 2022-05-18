# Automated Installation
# Feel free to "yarn install && yarn start" instead

clear
if [ ! -d node_modules ]
then
	echo "Installing Packages..."
	yarn install
	clear
	echo "Successfully installed all packages!"
else
	echo "Already installed packages."
fi
clear
echo "Running main script."
yarn dev