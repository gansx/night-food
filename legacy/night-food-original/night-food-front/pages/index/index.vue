<template>
	<view class="content">
		<u-swiper :list="list1" height='250' :circular='true' imgMode='aspectFit' indicator></u-swiper>
		<view class="user-info-box" v-if='userInfo.id'>
			<img style='width:100rpx;height:100rpx'
				:src="userInfo.profilePicture?userInfo.profilePicture:'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png'"
				shape="square"></img style='width:100rpx;height:100rpx'>
			<view class="user-info-right">
				<view class="user-nickname">{{ userInfo.name?userInfo.name:user_name }}</view>
				<view class="user-phone" v-if="userInfo.phone">
					<!-- {{ userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }} -->
				</view>
			</view>
		</view>
		<view class="login" v-else>
			<view class="left">
				<img class="logo" src="http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png"
					alt="夜食坊">
				<view class="text">
					<view class="logoTxt">
						夜食坊
					</view>
					<view class="main">
						为给您提供更好的服务请登录
					</view>
				</view>
			</view>
			<view class="right">
				<u-button color="#329532" shape='circle' size='small' text="登录 | 注册" @click="goPage('/pages/login/login',2)"></u-button>
			</view>
		</view>
		<view class="main">
			<view class="model">
				<view class="box" @click="goPage('/pages/order/order',1)">
					<view class="title">
						线上点单
					</view>
					<view class="detail">
						提前预约
					</view>
					<img src="http://xoa.zzots.cn//files/20240619/a0b08d8d2d0e45ebbcb02806ef3f93e8.jpg" class="box_img"
						alt="线上点单">
				</view>
				<view class="box" @click="goPage('/pages/task/task',1)">
					<view class="title">
						任务中心
					</view>
					<view class="detail">
						家庭小任务
					</view>
					<img src="http://xoa.zzots.cn//files/20240619/dfa741fc67454f569562ee04d86a8648.jpg" class="box_img"
						alt="任务中心">
				</view>
			</view>
			<view class="task">
				<view class="box" @click="goPage('/pages/indent/indent',1)">
					<view class="title">订单管理</view>
					<view class="img">
						<view class="txt">
							订单信息
						</view>
						<view style="font-size: 30rpx;" class="iconfont workshop-dingdanguanli">
						</view>
					</view>
				</view>
				<view class="box">
					<view class="title">兑换中心</view>
					<view class="img">
						<view class="txt">
							更多福利
						</view>
						<view style="margin-right: -27rpx;margin-top: -5rpx;" class="iconfont workshop-jifenduihuan">
						</view>
					</view>
				</view>
				<view class="box" @click="goPage('/pages/task/addTask',2)">
					
					<view class="title">发布任务</view>
					<view class="img">
						<view class="txt">
							新建任务
						</view>
						<view style="font-size: 40rpx;" class="iconfont workshop-faburenwu">
						</view>
					</view>
				</view>
			</view>
			<view class="biglogo">
				<img src="http://xoa.zzots.cn//files/20240619/5e7d7e367f474bf0a985d18826dcb5e1.png" alt="夜食坊">
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {},
				list1: [
					'https://img0.baidu.com/it/u=2515455495,2728365338&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
					'https://img1.baidu.com/it/u=3935095243,1855781320&fm=253&fmt=auto&app=138&f=JPEG?w=630&h=431',
					'https://img0.baidu.com/it/u=1983085644,1717622870&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
				]
			}
		},
		onShow() {
			this.userInfo = uni.getStorageSync('userInfo')
		},
		methods: {
			goPage(pageName, type) {
				switch (pageName) {
					default:
						if (type == 1) {
							uni.switchTab({
								url: pageName
							})
						} else {
							uni.navigateTo({
								url: pageName
							})
						}
						break;
				}
			}
		}
	}
</script>

<style lang="less" scoped>
	.content {
		.user-info-box {
			background: #ffffff;
			padding: 30rpx;
			margin: -80rpx 20rpx 20rpx 20rpx;
			position: relative;
			border-radius: 20rpx;
			display: flex;
			align-items: center;
		
			.user-avg {
				width: 100rpx;
				height: 100rpx;
				border-radius: 10rpx;
			}
		
			.user-nickname {
				margin-left: 20rpx;
			}
		
			.user-phone {
				margin-left: 20rpx;
				font-size: 24rpx;
				color: #666666;
			}
		}
		.login {
			background-color: #fff;
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 32rpx;
			padding: 15rpx 30rpx 15rpx 10rpx;
			border-radius: 10rpx;

			.left {
				display: flex;
				align-items: center;

				.text {

					.logoTxt {
						font-weight: 600;
					}
				}

				.main {
					font-size: 25rpx;
					margin-top: 15rpx;
					padding: 0;
				}

			}

			.logo {
				width: 100rpx;
				height: 100rpx;
			}
		}

		.main {
			padding: 0 20rpx;
			margin-top: 20rpx;

			.model {
				display: grid;
				grid-template-columns: 1fr 1fr;
				grid-gap: 20rpx;

				.box {
					text-align: center;
					padding: 25rpx;
					background: #fff;
					border-radius: 20rpx;

					.title {
						font-size: 40rpx;
						font-weight: 600;
						display: flex;
						justify-content: center;
					}

					.detail {
						color: #666;
						font-size: 28rpx;
						margin-top: 10rpx;
					}

					.box_img {
						margin-top: 10rpx;
						width: 220rpx;
						height: 200rpx;
					}
				}
			}

			.task {
				display: grid;
				grid-template-columns: 1fr 1fr 1fr;
				grid-gap: 20rpx;
				margin-top: 20rpx;

				.box {
					padding: 20rpx;
					background: #fff;
					border-radius: 20rpx;

					.title {
						font-size: 28rpx;
						font-weight: 600;
					}

					.img {
						color: #666;
						display: flex;
						margin-top: 10rpx;
						justify-content: space-between;
						font-size: 24rpx;

						.iconfont {
							font-size: 44rpx;

							color: #329532;
						}
					}
				}
			}

			.biglogo {
				background-color: #fff;
				margin-top: 20rpx;
				border-radius: 20rpx;
				text-align: center;

				img {
					height: 250rpx;
					weight: 150rpx;
				}
			}
		}
	}
</style>