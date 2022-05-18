<a align="left" href="https://replit.com/badge/github/rayhanadev/edge">
	<img src="https://replit.com/badge/github/rayhanadev/edge">
</a>

<p align="center">
	<a href="https://edge.furret.codes">
		<img src="https://edge.furret.codes/f/edge-screenshot.jpeg" alt="edge screenshot">
	</a>
</p>

My simple file host on Replit! Created in NodeJS using an Express server, it can handle any upload and display content with the correct MIME headers, in-browser.

To upload a file visit `/~` where you'll find the upload dashboard. The dashboard utilizes ReplAuth to check whether the uploader has proper permissions.

If you want a copy of this project, fork it and add the Replit usernames to the `WHITELISTED_USERS` array (or keep the array empty to create a public file host).