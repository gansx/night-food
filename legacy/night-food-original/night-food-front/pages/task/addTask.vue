<template>
	<view class="addOrder">
		<view class="iconfont workshop-xinxi">
		</view>
		<view class="main">
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-tuding"></span>任务名称
				</view>
				<u--input placeholder="请输入内容" border="none"></u--input>
			</view>
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-tubiaozhizuomoban"></span>任务详情
				</view>
				<u--textarea border='none' placeholder="请输入内容"></u--textarea>
			</view>
			<view class="label" style="border: none;">
				<view class="title">
					<span class="iconfont workshop-qiandai"></span>积分奖励
				</view>
				<u-slider :showValue='true'></u-slider>
			</view>
		</view>
		<view class="btns">
			<u-button style="width: 100%;" text="重置"></u-button>
			<u-button style="width: 100%;" type="primary" text="确定"></u-button>
		</view>
	</view>
</template>

<script>
	export default {
		name: "addOrder",
		data() {
			return {}
		},
		methods: {

		}
	}
</script>

<style lang="less" scoped>
	.addOrder {
		padding: 30rpx;

		.workshop-xinxi {
			text-align: center;
			color: #F5E18D;
			font-size: 300rpx;
		}

		.workshop-tuding {
			color: #EF5343;
		}

		.workshop-tubiaozhizuomoban {
			color: #CAC134;
		}

		.workshop-qiandai {
			color: #FFB800;
		}

		.main {
			background: #fff;
			margin-top: 30rpx;
			border-radius: 20rpx;

			.label {
				border-bottom: 1px solid #f1f1f1;
				padding: 30rpx;
			}
			
			.title {
				margin-bottom: 10rpx;
			}
		}

		.btns {
			position: fixed;
			bottom: 50rpx;
			padding: 0 30rpx;
			box-sizing: border-box;
			width: 92%;
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-gap: 25rpx;
		}
	}
</style>