import route from 'riot-route'

<mainmenu>
	<script>
		this.menuitems = {
			wallet:{
				link:'/wallet',
				name:'Wallet',
				active:true,
			},
			bankroll:{
				link:'/bankroll',
				name:'Bankroll',
				active:false,
			},
			// stat:{
			// 	link:'/stat',
			// 	name:'Stat',
			// 	active:false,
			// },
		}

		this.on('mount', ()=>{
			route((screen, action, other)=>{
				if (!screen) {
					screen = 'wallet'
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
		.mainmenu li a {

		}
	</style>

</mainmenu>
