<template>
	<view class="login">
		<img class="logo" src="http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png" alt="夜食坊">
		<view class="text">
			欢迎登录
		</view>
		<view class="loginbtn" @click="login">登录</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {

			};
		},
		methods: {
			login() {
				uni.login({
					success(code) {
						request('/user/login', 'POST', {
								code: code.code
							})
							.then(response => {
								if (response.code == 200) {
									uni.showToast({
										title: '登录成功',
										icon: 'success',
									})
									setTimeout(() => {
										if (response.isNew) {
											uni.navigateTo({
												url: '../main/userInfo'
											})
										} else {
											uni.switchTab({
												url: '../index/index'
											})
										}
									}, 500)
									uni.setStorageSync('token', response.data.token);
									uni.setStorageSync('userInfo', response.data.user);
								}
							})
							.catch(error => {
								console.error('请求失败:', error);
							});
					},
					fail(fail) {
						console.log(fail);
					}
				})
			}
		}
	}
</script>

<style lang="less">
	.login {
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: start;

		.loginbtn {
			background: #1FBA1A;
			color: #fff;
			padding: 20rpx;
			width: 80%;
			text-align: center;
			border-radius: 20rpx;
			margin-top: 30rpx;
		}

		.text {
			font-weight: 600;
			margin-top: 30rpx;
		}

		.logo {
			width: 150rpx;
			height: 150rpx;
			margin-top: 300rpx;
			border-radius: 50%;
		}
	}
</style>
