<lang>
	<script>
		this.text = ''
		this.on('mount',()=>{
			let lang = App.view.lang

			this.text = lang.i18n.localise( this.opts.word )
			this.update()

			lang.state.on('change', ()=>{
				this.text = lang.i18n.localise( this.opts.word )
				this.update()
			})
		})

		this.on('update',()=>{
		})
	</script>

	<span class="lang">
		{text}
	</span>

</lang>
