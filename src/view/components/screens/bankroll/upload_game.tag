import _config  from 'app.config'

<upload_game>
	<script>

		this.on('mount', ()=>{
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
				this.uploadGame(e)
			})
		})


		this.uploadGame = e=>{
			let manifest_finded = false

			function findManifest(item, path) {
				if (!item || manifest_finded) {
					return
				}

				path = path || ''
				if (item.isFile) {
					item.file(file => {
						if (file.name=='dapp.manifest') {
							manifest_finded = true
							fetch(_config.server+'/upload_game/',{
								method : 'POST',
								body   :  JSON.stringify({ manifest: {
									name : file.name,
									path : file.path || path,
								} })
							}).then(r=>{
								console.log(r)
							}).catch(err=>{
								console.error(err)
							})
							return
						}
					})
					return
				}

				if (item.isDirectory) {
					item.createReader().readEntries(function(entries) {
						for (let i=0; i < entries.length; i++) {
							findManifest(entries[i], path + item.name + '/')
						}
					})
				}
			}


			const items = event.dataTransfer.items

			for (let i=0; i < items.length; i++) {
				if (manifest_finded) { break }

				findManifest( items[i].webkitGetAsEntry() )
			}

			setTimeout(()=>{
				this.upload_procces = false
				if (!manifest_finded) {
					alert('Cant find manifest file ( ./dapp.manifest )' )
				};
			}, 5000)
		}

	</script>


	<form ref="form" method="post" action="?" enctype="multipart/form-data" novalidate class="box">

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
		.box
		{
			margin:0 15px;
			font-size: 1.25rem; /* 20 */
			background-color: #202020;
			position: relative;
			padding: 50px 20px;
		}
		.box.has-advanced-upload
		{
			outline: 2px dashed #444;
			outline-offset: -10px;

			-webkit-transition: outline-offset .15s ease-in-out, background-color .15s linear;
			transition: outline-offset .15s ease-in-out, background-color .15s linear;

			input { display: none; }
		}
		.box.is-dragover
		{
			outline-offset: -20px;
			outline-color: #ed9726;
			/*background-color: #000;*/
		}
		.box__dragndrop,
		.box__icon
		{
			display: none;
			path { fill: #444; }
		}
		.box.has-advanced-upload .box__dragndrop
		{
			display: inline;
		}
		.box.has-advanced-upload .box__icon
		{
			width: 100%;
			height: 80px;
			fill: #92b0b3;
			display: block;
			margin-bottom: 40px;
		}

		.box.is-uploading .box__input,
		.box.is-success .box__input,
		.box.is-error .box__input
		{
			visibility: hidden;
		}

		.box__uploading,
		.box__success,
		.box__error
		{
			display: none;
		}
		.box.is-uploading .box__uploading,
		.box.is-success .box__success,
		.box.is-error .box__error
		{
			display: block;
			position: absolute;
			top: 50%;
			right: 0;
			left: 0;

			-webkit-transform: translateY( -50% );
			transform: translateY( -50% );
		}
		.box__uploading
		{
			font-style: italic;
		}
		.box__success
		{
			-webkit-animation: appear-from-inside .25s ease-in-out;
			animation: appear-from-inside .25s ease-in-out;
		}
			@-webkit-keyframes appear-from-inside
			{
				from	{ -webkit-transform: translateY( -50% ) scale( 0 ); }
				75%		{ -webkit-transform: translateY( -50% ) scale( 1.1 ); }
				to		{ -webkit-transform: translateY( -50% ) scale( 1 ); }
			}
			@keyframes appear-from-inside
			{
				from	{ transform: translateY( -50% ) scale( 0 ); }
				75%		{ transform: translateY( -50% ) scale( 1.1 ); }
				to		{ transform: translateY( -50% ) scale( 1 ); }
			}

		.box__restart
		{
			font-weight: 700;
		}
		.box__restart:focus,
		.box__restart:hover
		{
			color: #39bfd3;
		}

		.js .box__file
		{
			width: 0.1px;
			height: 0.1px;
			opacity: 0;
			overflow: hidden;
			position: absolute;
			z-index: -1;
		}
		.js .box__file + label
		{
			max-width: 80%;
			text-overflow: ellipsis;
			white-space: nowrap;
			cursor: pointer;
			display: inline-block;
			overflow: hidden;
		}
		.js .box__file + label:hover strong,
		.box__file:focus + label strong,
		.box__file.has-focus + label strong
		{
			color: #39bfd3;
		}
		.js .box__file:focus + label,
		.js .box__file.has-focus + label
		{
			outline: 1px dotted #000;
			outline: -webkit-focus-ring-color auto 5px;
		}
			.js .box__file + label *
			{
				/* pointer-events: none; */ /* in case of FastClick lib use */
			}

		.no-js .box__file + label
		{
			display: none;
		}

		.no-js .box__button
		{
			display: block;
		}
		.box__button
		{
			font-weight: 700;
			color: #e5edf1;
			background-color: #111;
			display: block;
			padding: 8px 16px;
			margin: 40px auto 0;
		}
		.box__button:hover,
		.box__button:focus
		{
			background-color: #000;
		}

	</style>
</upload_game>
