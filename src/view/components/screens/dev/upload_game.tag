import DApps from 'DApps'
import './dapps_list.less'
<upload_game>
	<script>
		this.on('mount', ()=>{
			setInterval(()=>{
				this.dapps = DApps.List 
				this.update()
			}, 1000)

			const form = this.refs.form
			form.classList.add( 'has-advanced-upload' ); // letting the CSS part to know drag&drop is supported by the browser

			[ 'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop' ].forEach( event =>{
				form.addEventListener( event, e => {
					e.preventDefault()
					e.stopPropagation()
				})
			});

			[ 'dragover', 'dragenter' ].forEach( event =>{
				form.addEventListener( event, ()=>{
					form.classList.add( 'is-dragover' )
				})
			});

			[ 'dragleave', 'dragend', 'drop' ].forEach( event =>{
				form.addEventListener( event, ()=>{
					form.classList.remove( 'is-dragover' )
				})
			})

			form.addEventListener( 'drop',  e => {
				this.upload_procces = true
				this.update()

				DApps.upload(e, res => {
					this.upload_procces = false
					this.update()

					console.log(res)

					if (res.error) {
						alert(res.error)
						return
					}

					location.reload()
				})
			})
		})

	</script>

	<table id="dapps_list">
		<caption>DApps</caption>
		<thead>
			<tr>
				<th>Code</th>
				<th></th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr each={dapp in dapps}>
				<td class="code">{dapp.config.name}</td>
				<td><pre>{JSON.stringify(dapp)}</pre></td>
				<td>
					<a href="#remove">remove</a>
				</td>
			</tr>
		</tbody>
	</table>

	<form ref="form" method="post" action="?" enctype="multipart/form-data" novalidate class="box">

		<div if={this.upload_procces}> Upload process </div>

		<div class="box__input">
			<svg class="box__icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43"><path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"/></svg>

			<!-- <input type="file" name="files[]" id="file" class="box__file" data-multiple-caption="{count} files selected" multiple /> -->

			<label for="file"><strong>Drag game folder</strong><span class="box__dragndrop"> here</span>.</label>

			<!-- <button type="submit" class="box__button">Upload</button> -->
		</div>


		<div class="box__uploading">Uploading&hellip;</div>
		<div class="box__success">Done! <a href="https://css-tricks.com/examples/DragAndDropFileUploading//?submit-on-demand" class="box__restart" role="button">Upload more?</a></div>
		<div class="box__error">Error! <span></span>. <a href="https://css-tricks.com/examples/DragAndDropFileUploading//?submit-on-demand" class="box__restart" role="button">Try again!</a></div>
	</form>

	<style type="less">
		
	</style>
</upload_game>
