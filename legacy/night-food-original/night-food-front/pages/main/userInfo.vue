<template>
	<view class="userInfo">
		<view class="box" @click='topage("profilePicture")'>
			<view class="title">头像</view>
			<view class="right">
				<u-avatar size='90rpx' :src="userInfo.profilePicture?userInfo.profilePicture:'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png'"
				 shape="square"></u-avatar>
				<u-upload name="6" accept='image' :maxCount="1">
					<u--text prefixIcon="arrow-right"></u--text>
				</u-upload>
			</view>
		</view>
		<view class="box" @click='topage("name")'>
			<view class="title">名字</view>
			<view class="right">
				<view class="name">
					{{userInfo.name}}
				</view>
				<u-icon slot="right" style='margin-top:10rpx' name="arrow-right"></u-icon>
			</view>
		</view>
		<view class="box">
			<view class="title">家庭</view>
			<view class="right">
				<view class="name">
					{{userInfo.family?userInfo.family:'暂无'}}
				</view>
			</view>
		</view>
		<view class="box">
			<view class="title">角色</view>
			<view class="right">
				<view class="name">
					{{userInfo.role?userInfo.role:'暂无'}}
				</view>
			</view>
		</view>
		<view class="box" @click='topage("sex")'>
			<view class="title">性别</view>
			<view class="right">
				<view class="name">
					{{userInfo.sex==1?'男':userInfo.sex===0?'女':'暂无'}}
				</view>
				<u-icon slot="right" style='margin-top:10rpx' name="arrow-right"></u-icon>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				userInfo: {}
			}
		},
		onShow() {
			this.getUserInfo()
		},
		methods: {
			topage(type) {
				uni.navigateTo({
					url: `/pages/main/updateUser?type=${type}&userInfo=${JSON.stringify(this.userInfo)}`
				})
			},
			getUserInfo() {
				request('/user/' + uni.getStorageSync('userInfo').id, 'get')
					.then(res => {
						if (res.code != 200) {
							return uni.showToast({
								title: res.msg,
								icon: 'error'
							})
						}
						this.userInfo = res.data
					})
					.catch(error => {
						console.error('请求失败:', error);
					});
			},

		}
	}
</script>

<style scoped lang="less">
	.userInfo {
		/deep/button {
			border: none !important;
			background: none !important;
		}

		.box {
			background: #fff;
			padding: 0 30rpx;
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid #dfdfdf;
			height: 100rpx;

			.right {
				display: flex;
				align-items: center;

				.name {
					color: #999;
					margin-right: 5rpx;
				}

				/deep/.u-icon__icon {
					top: 2rpx !important
				}
			}
		}
	}
</style>
