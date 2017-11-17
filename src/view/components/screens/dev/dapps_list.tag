import DApps from 'DApps/DApps'
import './dapps_list.less'

const fs = require('fs')

<dapps_list>
	<script>

		const prettyJson = {
			replacer: function(match, pIndent, pKey, pVal, pEnd) {
				var key = '<span class=json-key>';
				var val = '<span class=json-value>';
				var str = '<span class=json-string>';
				var r = pIndent || '';
				if (pKey)
				 r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
				if (pVal)
				 r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
				return r + (pEnd || '');
			},
			print: function(obj) {
				var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
				return JSON.stringify(obj, null, 3)
				 .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
				 .replace(/</g, '&lt;').replace(/>/g, '&gt;')
				 .replace(jsonLine, prettyJson.replacer);
			}
		}

		this.on('unmount', ()=>{
			clearInterval(this.upd_i)
		})

		this.on('mount', ()=>{
			this.upd_i = setInterval(()=>{
				this.dapps = DApps.List 
				this.dapps_path = DApps.info.dapps_path.split(/\/\w+\/\.\./i).join('')
				this.update()
			}, 1000)

			this.isMac = (navigator.platform.toLowerCase().indexOf('mac') > -1)

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
				
				console.log('start upload', e);

				DApps.upload(e, res => {
					this.upload_procces = false
					this.update()

					alert(JSON.stringify(res))

					console.log(res)

					if (res.error) {
						alert(res.error)
						return
					}

					location.reload()
				})
			})
		})


		this.remove = e =>{
			e.preventDefault()
			let key = e.item.dapp.config.name
			if (confirm(`You should want to remove ${key} dapp?`)) {
				DApps.remove(key, ()=>{
					Object.keys(this.dapps).forEach(d=>{
						if ( d.toLowerCase() === key.toLowerCase() ) {
							delete(this.dapps[d])
						}
					})
					this.update()
				})
			}
		}

		this.jsonPrint = d =>{
			return prettyJson.print( Object.assign( d.config, {path:d.path} ))
		}

		this.toggleConfig = e =>{
			e.preventDefault()
			e.item.dapp.show_config = !e.item.dapp.show_config
			console.info('e.item.show_config',e.item.dapp.show_config);
			this.update()
		}


		this.deployIPFS = e =>{
			e.preventDefault()

			alert('deploy SAM )')

		}
	</script>

	<div class="links">
		<a target="_blank" href="https://github.com/DaoCasino/BankRollerApp/raw/master/DApps/example.zip">Download DApp exmaple</a>
		<a target="_blank" href="https://github.com/DaoCasino/DCLib">Read docs</a>
	</div>

	<table id="dapps_list">
		<caption>DApps</caption>
		<tbody><tr><td>
			
			<div class="dapp" each={dapp in dapps}>
				<span class="code">{dapp.config.name}</span>
				

				<p class="local-path"><b>Local path</b>: {dapps_path}{dapp.config.code}</p>

				<div class={config:true, show:dapp.show_config}>
					<a onclick={toggleConfig} href="#config">show dapp.manifest</a>
					<pre><raw html={this.jsonPrint(dapp)}" /></pre>
				</div>

				<div class="actions">
					<a class="open-in-browser" target="_blank" href="{dapp.frontend_url}">Open in browser</a>
					<a onclick={remove} href="#remove">remove</a>
					<a onclick={deployIPFS} href="#upload_ips">deploy 2 IPFS</a>
				</div>
			</div>
		</td></tr></tbody>
	</table>

	<div class="upload-block">
		<div class={other:true, show:!isMac}>
			For add DApp to list, place folder width dapp.manifest file 
			to <span>{dapps_path}</span>
		</div>

		<div class={macos:true, show:isMac}>
			<p>For add new DApp</p>
			<form ref="form" method="post" action="?" enctype="multipart/form-data" novalidate class="box">
				<div if={this.upload_procces}> Uploading...</div>

				<div class="box__input">
					<svg class="box__icon" xmlns="http://www.w3.org/2000/svg" width="50" height="43" viewBox="0 0 50 43"><path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"/></svg>

					<label for="file"><strong>Drag folder with dapp.manifest</strong><span class="box__dragndrop"> here</span>.</label>
				</div>


				<div class="box__uploading">Uploading&hellip;</div>
				<div class="box__success">Done! <a href="https://css-tricks.com/examples/DragAndDropFileUploading//?submit-on-demand" class="box__restart" role="button">Upload more?</a></div>
				<div class="box__error">Error! <span></span>. <a href="https://css-tricks.com/examples/DragAndDropFileUploading//?submit-on-demand" class="box__restart" role="button">Try again!</a></div>
			</form>
		</div>
	</div>

	<style type="less">
		
	</style>
</dapps_list>
