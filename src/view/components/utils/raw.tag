<raw>

	<script>
		this.on('mount',()=>{
			this.root.innerHTML = this.opts.html
		})
		this.on('update',()=>{
			this.root.innerHTML = this.opts.html
		})
	</script>

	<div class="raw-html"></div>

</raw>
