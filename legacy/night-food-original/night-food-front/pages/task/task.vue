<template>
	<view class="task">
		<u-sticky bgColor="#fff" style="padding-bottom: 20rpx;">
			<image mode="aspectFit" class="headImg" src="https://img1.baidu.com/it/u=992990061,2576285882&fm=253&fmt=auto&app=138&f=PNG?w=658&h=359">
			</image>
			<u-search placeholder="请输入任务名称" v-model="keyword"></u-search>
			<view style="height: 13rpx;"></view>
		</u-sticky>
		<view class="main">
			<uni-swipe-action>
				<uni-swipe-action-item v-for="item in 10" :key="item">
					<view class="content-box" @click="toDetails(1)">
						<view class="text">
							<view class="title">
								打扫房间
							</view>
							<view class="cost">
								<span class="iconfont qiandai workshop-qiandai"></span>100积分
							</view>
							<view class="time">
								<span class="iconfont shijian workshop-shijian"></span>12458405
							</view>
						</view>
						<image mode="aspectFit" src="http://xoa.zzots.cn//files/20240619/ac518aeaea3e4875913b64d26e5ba2ff.png"></image>
					</view>
					<template #right>
						<view class="slot-button">
							<view class="iconfont gouwuche workshop-gouwuche">
							</view>
							<view class="iconfont shoucang workshop-shoucang">
							</view>
							<view class="iconfont shanchu workshop-shanchu">
							</view>
						</view>
					</template>
				</uni-swipe-action-item>
			</uni-swipe-action>
		</view>
		<view style="height: 100rpx;">
		</view>
		<view class="addTask" @click="toPage">
			<u-icon name="plus" color="#93969C" size="20"></u-icon>
		</view>
		<u-back-top bottom='50' :scroll-top="scrollTop"></u-back-top>
	</view>
</template>

<script>
	import uniSwipeAction from '@/uni_modules/uni-swipe-action/components/uni-swipe-action/uni-swipe-action';
	import uniSwipeActionItem from '@/uni_modules/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item';
	export default {
		name: "task",
		components: {
			uniSwipeAction,
			uniSwipeActionItem
		},
		data() {
			return {
				scrollTop: 0
			}
		},
		onPageScroll(e) {
			this.scrollTop = e.scrollTop;
		},
		methods: {
			toPage() {
				uni.navigateTo({
					url: '/pages/task/addTask'
				})
			},
			toDetails(x) {
				uni.navigateTo({
					url: '/pages/task/taskDetails?id=' + x
				})
			},
		}
	}
</script>

<style lang="less" scoped>
	.task {
		position: relative;

		.addTask {
			position: fixed;
			bottom: 10rpx;
			right: 42rpx;
			background: #E1E1E1;
			border-radius: 50%;
			padding: 20rpx;
		}

		.headImg {
			width: 100%;
			height: 420rpx;
		}

		.main {
			padding: 0 20rpx;
			margin-top: 20rpx;

			.uni-page {
				padding: 0;
			}

			/deep/.uni-swipe {
				font-size: 30rpx;
				box-sizing: border-box;
				background-color: #fff;
				border-bottom-color: #f5f5f5;
				border-bottom-width: 1px;
				border-bottom-style: solid;
			}

			.content-box {
				padding: 15rpx;
				background-color: #fff;
				font-size: 40rpx;
				display: flex;
				justify-content: space-between;

				image {
					height: 150rpx;
					width: 150rpx;
				}

				.title {
					font-weight: 600;
					margin-bottom: 10rpx;
				}

				.cost,
				.time {
					font-size: 26rpx
				}

				.time {
					color: #999;
					margin-top: 10rpx;
				}

				.qiandai {
					margin: 0;
					padding: 0;
					color: #FFB800;
				}

				.shijian {
					margin: 0;
					padding: 0;
					color: #25AFF3;
				}
			}



			.slot-button {
				/* #ifndef APP-NVUE */
				display: flex;
				height: 100%;
				/* #endif */
				flex: 1;
				flex-direction: row;
				justify-content: center;
				align-items: center;
				padding: 0 20px;
			}

			.iconfont {
				border-radius: 50%;
				color: #000;
				padding: 15rpx;
				font-size: 33rpx;
				margin-left: 40rpx;
			}

			.shanchu {
				background: #E9A489;
			}

			.shoucang {
				background: #F1DA4B;
			}

			.gouwuche {
				background: #C3F963;
			}

		}
	}
</style>
