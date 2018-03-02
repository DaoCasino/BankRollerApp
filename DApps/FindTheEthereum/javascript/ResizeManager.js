/**
 * Created by marchenko on 18.07.16.
 */
var globalScale = 1;
var isCanvas = true;
var renderSize = 1;
var stageScale = 1;

function onResize()
{
    if (!renderer) return;

    var realW = window.innerWidth;
    var realH = window.innerHeight;

    globalScale = Math.min(realW / _W, realH / _H);

    if (renderer instanceof PIXI.CanvasRenderer)
    {
        isCanvas = true;
    }
    else
    {
        isCanvas = false;
    }

    renderer.resize(_W/renderSize, _H/renderSize);

    renderer.view.style.width = _W * globalScale + 'px';
    renderer.view.style.height = _H * globalScale+ 'px';

    renderer.view.style.position = 'absolute';
    renderer.view.style.left = (realW / 2 - _W * globalScale / 2) + 'px';
    renderer.view.style.top = (realH / 2 - _H * globalScale / 2) + 'px';

    stage.scale.x = stageScale;
    stage.scale.y = stageScale;

}