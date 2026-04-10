<template>
	<view class="updateUser">
		<view class="form">
			<input type="nickname" v-if="type=='name'" class="userName" placeholder="请输入昵称" v-model="userInfo.name" input="bindblur"
			 @blur="bindblur"></input>
			<view v-if="type=='sex'" @click="show=true" @blur="bindblur">
				{{userInfo.sex==1?'男':userInfo.sex===0?'女':'请选择'}}
			</view>

			<button style="width: 150rpx;height: 150rpx;padding: 0;background: #efefef;color: #434343;" class="avatar-wrapper"
			 v-if="type=='profilePicture'" open-type="chooseAvatar" @chooseavatar="afterRead">
				<image v-if="type=='profilePicture'" style="width: 150rpx;height: 150rpx;" class="userImg" :src="userInfo.profilePicture?userInfo.profilePicture:'http://xoa.zzots.cn//files/20240619/fd0d8254067c4343b09ea724c1224e1b.png'"></image>
			</button>

		</view>
		<u-picker :show="show" :columns="sexOPtion" keyName="label" @close='show=false' @confirm='confirm'></u-picker>
		<view class="btn" @click="submitForm">
			确认
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				type: "",
				userInfo: {
					name: "",
				},
				show: false,
				sexOPtion: [
					[{
						label: '男',
						value: 1
					}, {
						label: '女',
						value: 0
					}]
				],
				typeShow: {
					name: {
						key: 'name',
						header: "修改昵称",
					},
					sex: {
						key: 'sex',
						header: "修改性别",
					},
					profilePicture: {
						key: 'profilePicture',
						header: "修改头像",
					},
				},
			}
		},
		onLoad(x) {
			this.type = x.type
			this.userInfo = JSON.parse(x.userInfo)
			uni.setNavigationBarTitle({
				title: this.typeShow[this.type].header
			});

		},
		methods: {
			afterRead(res) {
				uni.uploadFile({
					url: "https://xcx.zzots.cn//projectManage-admin/sys/oss/uploadAndCreateEnclosure",
					filePath: res.detail.avatarUrl,
					name: "file",
					success: (res) => {
						uni.showToast({
							title: '上传成功',
							icon: 'success',
						})
						let data = JSON.parse(res.data);
						this.userInfo.profilePicture = data.data[0].remoteSrc
					},
				})
			},
			confirm(x) {
				this.userInfo.sex = x.value[0].value
				this.show = false
			},
			submitForm() {
				request('/user/update', 'post', this.userInfo)
					.then(res => {
						if (res.code != 200) {
							return uni.showToast({
								title: res.msg,
								icon: 'error'
							})
						}
						uni.showToast({
							title: '修改成功',
							icon: 'success',
						})
						setTimeout(() => {
							uni.navigateBack(-1)
						}, 500)
					})
					.catch(error => {
						console.error('请求失败:', error);
					});

			},
			bindblur(event) {
				if (event.target.value) {
					this.userInfo.name = event.target.value
				}
			},
		}
	}
</script>

<style scoped lang="less">
	.updateUser {
		height: 100vh;
		background: #fff;
		text-align: center;

		.form {
			padding-top: 400rpx;
		}

		.btn {
			background: rgb(239, 239, 239);
			color: rgb(67, 67, 67);
			padding: 20rpx;
			border-radius: 20rpx;
			width: 300rpx;
			margin: 0 auto;
			position: absolute;
			left: 0;
			right: 0;
			bottom: 200rpx;
		}
	}
</style>
