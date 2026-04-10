<template>
	<view class="taskDetails">
		<view style="text-align: center;">
			<img class="topImg" src="http://211.149.132.103:7029//files/20240620/2cae6b903f8342da828815cec92b97c8.png"
				alt="">
		</view>
		<view class="main">
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-tuding"></span>任务名称
				</view>
				<view class="txt">
					打扫房间
				</view>
			</view>
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-tubiaozhizuomoban"></span>任务详情
				</view>
				<view class="txt">
					发噶紧急阿富汗三个
				</view>
			</view>
			<view class="label">
				<view class="title">
					<u-icon name="account-fill" color="#008c8c" size="18"></u-icon>发布人
				</view>
				<view class="txt">
					夜食
				</view>
			</view>
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-rili"></span>发布时间
				</view>
				<view class="txt">
					2024-06-20 12:00:00
				</view>
			</view>
			<view class="label">
				<view class="title">
					<span class="iconfont workshop-qiandai"></span>积分奖励
				</view>
				<view class="txt">
					100
				</view>
			</view>
			<view class="label">
				<view class="title">
					<u-icon name="account-fill" color="#008c8c" size="18"></u-icon>接取人
				</view>
				<view class="txt">
					暂无
				</view>
			</view>
			<view class="label" style="border: none;">
				<view class="title">
					<span class="iconfont workshop-rili"></span>接取时间
				</view>
				<view class="txt">
					暂无
				</view>
			</view>
		</view>
		<view style="height: 150rpx;">

		</view>
		<view class="btns">
			<u-button style="width: 100%;" type="primary" text="领取"></u-button>
		</view>
	</view>
</template>

<script>
	export default {
		name: "taskDetails",
		data() {
			return {}
		},
		methods: {}
	}
</script>

<style lang="less" scoped>
	.taskDetails {
		padding: 30rpx;

		.topImg {
			height: 300rpx;
			width: 300rpx;
			margin: 0 auto;
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

		.workshop-rili {
			color: #1E80FF;
		}

		.main {
			background: #fff;
			margin-top: 30rpx;
			border-radius: 20rpx;

			.label {
				border-bottom: 1px solid #f1f1f1;
				padding: 30rpx;
			}

			.txt {
				color: #999;
				font-size: 26rpx
			}

			.title {
				margin-bottom: 10rpx;
				display: flex;
				align-items: center;
			}
		}

		.btns {
			position: fixed;
			bottom: 50rpx;
			padding: 0 30rpx;
			box-sizing: border-box;
			width: 92%;
			grid-gap: 25rpx;
		}

	}
</style>