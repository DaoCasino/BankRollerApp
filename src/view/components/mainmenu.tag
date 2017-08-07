import route from 'riot-route'

<mainmenu>
	<script>
		this.menuitems = {
			wallet:{
				link:'#wallet',
				name:'Wallet',
				active:true,
			},
			bankroll:{
				link:'#bankroll',
				name:'Bankroll',
				active:false,
			},
			referer:{
				link:'#referer',
				name:'Referer',
				active:false,
			},
		}

		this.on('mount', ()=>{
			route((screen, action, other)=>{
				if (!screen) {
					screen = 'wallet'
				}

				if (!localStorage.keysSaved) {
					screen='save_keys'
					return
				}

				for(let k in this.menuitems){
					if (k==screen) {
						this.menuitems[k].active = true
					} else {
						this.menuitems[k].active = false
					}
				}
				this.update()
			})
		})
	</script>

	<ul class="mainmenu" >
		<li each={item, k in menuitems}>
			<a href="{item.link}" class={active:item.active, ripple:true} draggable="false" >
				{item.name}
			</a>
		</li>
	</ul>

	<style type="less">
		.mainmenu {
			&, li, a {  display:inline-block; }
			a {
				overflow:inherit;
				border-bottom: 2px solid #222;
				padding:15px 20px 10px 20px;
				text-transform: uppercase; letter-spacing: 1px; font-size: 12px;

				transition:opacity 0.2s ease, border 0.2s ease;
				opacity: 0.5;
				&:hover {
					opacity: 0.6;
					border-color: #aaa;
				}

				&.active {
					opacity:0.8;
					border-color: #fff;
				}
			}
		}
	</style>

</mainmenu>
