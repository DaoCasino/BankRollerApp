<spinner>
	<div class="spinner-wrap">
		<div class="spinner">
			<div class="circle one"></div>
			<div class="circle two"></div>
			<div class="circle three"></div>
		</div>
		<p>{opts.text}</p>
	</div>
	<style type="less">
		.spinner-wrap p {
			position: absolute;
			top:30%;
			text-align: center;
			width: 100%;
			margin: 0 0 0 -30px; padding:0;
			color: #ccc;
		}
		.spinner {
			position: absolute;

			top: 20%;
			left: 50%;
			margin: -90px 0 0 -90px;

			.circle {
				position: absolute;
				border: 3px solid transparent;
				border-top-color: #aaa;
				border-radius: 50%;
				animation: rotate linear infinite;
			}
			.circle.one {
				height: 50px;
				width: 50px;
				left: 50px;
				top: 50px;
				animation-duration: 0.85s;
			}
			.circle.two {
				height: 75px;
				width: 75px;
				top: 38px;
				left: 38px;
				animation-duration: 0.95s;
			}
			.circle.three {
				height: 100px;
				width: 100px;
				top: 25px;
				left: 25px;
				animation-duration: 1.05s;
			}

			@keyframes rotate {
				from {
						transform: rotateZ(360deg);
				}
				to {
						transform: rotateZ(0deg);
				}
			}
		}

	</style>
</spinner>
