import route from 'riot-route'
import $     from 'jquery'
<app>
  <script>
    this.on('mount', () => {
      route((screen, action, other) => {
        if (!screen) {
          screen = 'dev'
        }

        if (!localStorage.keysSaved) {
          screen = 'save_keys'
        }

        $('html,body').scrollTop(0)
        riot.mount(this.refs.mount_point, screen)
      })
    })
  </script>


  <header>
    <a class="logo" title="Dao.Casino Platform" href="https://dao.casino/" target="_blank" rel="noopenr" draggable="false" >
      <img src="./static/img/logo.svg">
    </a>

    <mainmenu></mainmenu>
    <network_switcher></network_switcher>
  </header>

  <section id="content" ref="mount_point">
    <wallet></wallet>
  </section>

  <footer>

  </footer>

</app>
