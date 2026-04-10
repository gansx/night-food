<template>
	<view class="user">
		<!-- 底图 - 开始 -->
		<image class="user-header-image" src="http://xoa.zzots.cn//files/20240619/2c76614f61ea4e508580a5e76c2bafb0.webp"></image>
		<!-- 底图 - 结束 -->

		<!-- 用户信息 - 开始 -->
		<view class="user-info-box" v-if='userInfo.id'>
			<img style='width:100rpx;height:100rpx' :src="userInfo.profilePicture?userInfo.profilePicture:'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png'"
			 shape="square"></img style='width:100rpx;height:100rpx'>
			<view class="user-info-right">
				<view class="user-nickname">{{ userInfo.name?userInfo.name:user_name }}</view>
				<view class="user-phone" v-if="userInfo.phone">
					<!-- {{ userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }} -->
				</view>
			</view>
		</view>
		<view class="login user-info-box" v-else>
			<view class="left">
				<img class="logo" src="http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png" alt="夜食坊">
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
				<u-button color="#329532" shape='circle' size='small' text="登录 | 注册" @click="goPage('/pages/login/login')"></u-button>
			</view>
		</view>
		<!-- 用户信息 - 结束 -->

		<!-- 充值优惠 - 开始 -->
		<view class="user-recharge-wrapper">
			<view class="user-recharge-box">
				<view class="recharge-info">
					<view class="info-title">
						账户充值
					</view>
					<view class="info-content">
						由于无商户号无法对接微信支付 支付由积分代替
					</view>
				</view>

				<view class="recharge-button" @click="goPage('/pages/task/task',2)">
					立即获取
				</view>
			</view>

			<u-line color="#efefef"></u-line>

			<view class="recharge-user-money">
				<view class="recharge-money-title">积分：</view>
				<view class="recharge-money">¥ {{userInfo.points||0}}</view>
			</view>
		</view>
		<!-- 充值优惠 - 结束 -->

		<!-- 列表菜单 - 开始 -->
		<view class="user-activity-menu">
			<view class="menu-item" @click="goPage('/pages/main/userInfo')">
				<view class="left">
					<image class="menu-icon" src=" http://xoa.zzots.cn//files/20240619/be1e47d117144c8abd814eaa76bbfffe.png"></image>
					<view class="menu-name">个人资料</view>
				</view>
				<u-icon name="arrow-right"></u-icon>
			</view>
			<view class="menu-item" @click="goPage('/pages/main/coupon')">
				<view class="left">
					<image class="menu-icon" src="http://xoa.zzots.cn//files/20240619/b3deabee710f434dac2d3ed18ac678a3.png"></image>
					<view class="menu-name">我的卡卷</view>
				</view>
				<u-icon name="arrow-right"></u-icon>
			</view>
			<view class="menu-item" @click="goPage('/pages/indent/indent',2)">
				<view class="left">
					<image class="menu-icon" src="http://xoa.zzots.cn//files/20240619/7632dcec38b3407da1ac103bfcf3023b.png"></image>
					<view class="menu-name">我的订单</view>
				</view>
				<u-icon name="arrow-right"></u-icon>
			</view>
			<button class="menu-item button" open-type='contact'>
				<view class="left">
					<image class="menu-icon" src="http://xoa.zzots.cn//files/20240619/31ce8e64de674b3a94b99caef619bef4.png"></image>
					<view class="menu-name">联系我们</view>
					<!-- <button class="menu-name button" open-type='contact'>联系我们</button> -->
				</view>
				<u-icon name="arrow-right"></u-icon>
			</button>
			<view class="menu-item">
				<view class="left">
					<image class="menu-icon" src="http://xoa.zzots.cn//files/20240619/9e55e7674d4c4d59a36173185c5a8072.png"></image>
					<view class="menu-name">当前版本</view>
				</view>
				<view class="menu-number">{{ version }}</view>
			</view>
		</view>
		<!-- 列表菜单 - 结束 -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				version: '1.0.0',
				user_banner: '../../static/images/banner.webp',
				user_name: '夜食坊',
				userInfo: {}
			};
		},
		created() {
			let _this = this
			uni.getSystemInfo({
				success: function(res) {
					_this.version = res.appVersion
				},
			})
		},
		onShow() {
			this.userInfo = uni.getStorageSync('userInfo')
		},
		methods: {
			/* 跳转页面 */
			goPage(pageName, type) {
				switch (pageName) {
					default:
						if (type) {
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

<style>
	page {
		background: #F4F4F4;
	}
</style>

<style lang="scss" scoped>
	.user {
		.user-header-image {
			width: 100%;
		}

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

		.user-recharge-wrapper {
			background: #ffffff;
			border-radius: 20rpx;
			padding: 30rpx;
			margin: 20rpx;

			.user-recharge-box {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 20rpx;

				.recharge-info {
					.info-title {
						color: #333;
						font-size: 28rpx;
						font-weight: bold;
					}

					.info-content {
						color: #999;
						font-size: 24rpx;
					}
				}

				.recharge-button {
					// background: #ff4131;
					color: #333;
					padding: 10rpx 20rpx;
					font-size: 22rpx;
					border-radius: 50rpx;
					flex-shrink: 0;
					border: 1rpx solid #dadbde;
				}
			}

			.recharge-user-money {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-top: 20rpx;
				font-size: 26rpx;
				color: #333;

				.recharge-money {
					font-weight: bold;
					font-size: 30rpx;
				}

				.recharge-money::first-letter {
					font-size: 22rpx;
				}
			}
		}

		.user-activity-menu {
			padding: 30rpx;
			margin: 20rpx;
			border-radius: 20rpx;
			background: #fff;

			.menu-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-top: 60rpx;

				.left {
					display: flex;
					align-items: center;

					.menu-icon {
						width: 40rpx;
						height: 40rpx;
					}


					.menu-name {
						font-size: 28rpx;
						margin-left: 20rpx;
						color: #333;
					}

				}



				.menu-number {
					font-size: 30rpx;
					color: #666666;
					letter-spacing: 2rpx;
				}
			}

			.menu-item:first-child {
				margin-top: 0;
			}

			.menu-item.button {
				border: none;
				background: none;
				padding: 0;
				width: 100%;

				&::after {
					border: none;
				}
			}
		}
	}
</style>
