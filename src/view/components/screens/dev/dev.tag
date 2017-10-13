// import _config  from 'app.config'
// import {Wallet} from 'Eth/Eth'

<dev>
	<script>
		this.loading = true

		this.on('mount', ()=>{
			this.loading = false
			this.update()
		})
	</script>

	<div id="dev" class={screen:true, loading:this.loading}>

		<div class="upload-area">
			<upload_game></upload_game>
		</div>

		
	</div>

	<style type="less">

	</style>

</dev>
