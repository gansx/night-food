<template>
	<view class="pages">
		<view class="order">
			<view class="listType">
				<view class="typeName" @click="changeActive(item)" :class="item.value==active?'active':''" v-for="item in foodList"
				 :key="item">
					{{item.label}}
				</view>
			</view>
			<scroll-view class="foodList" :enable-back-to-top="true" @scroll="myonPageScroll" :scroll-with-animation="true"
			 :scroll-y="true" style="height: 97vh;" :scroll-into-view="scrollintoview">
				<view class="box main-item" v-for="(item,index) in foodList" :key="item" :id='"box"+item.value'>
					<view class="title">
						{{item.label}}
					</view>
					<u-empty text='暂无内容' mode="car" icon="http://cdn.uviewui.com/uview/empty/car.png" v-if="item.children.length==0||!item.children"></u-empty>
					<view class="commodity" :class="'commodity'+x.id" v-for="x,i in item.children" :key="x">
						<view class="img">
							<view style="width: 180rpx">
								<image :src="x.menuUrl" alt="" />
							</view>
							<view class="text">
								<view class="dishName">
									{{x.menuName}} <span style="font-size: 0.6rem;color: orange;">￥{{x.money||0}}</span>
								</view>
								<view class="num">
									已点 <span>{{x.num||0}}</span>
								</view>
								<view class="description" v-if="x.remark">
									{{x.remark}}
								</view>
							</view>
						</view>
						<view :class="'plus-circle-fill'+index+''+i" @click="addList(x,'plus-circle-fill'+index+''+i,$event)">
							<u-icon name="plus-circle-fill" color="#FE9A00" size="18"></u-icon>
						</view>
					</view>
				</view>
				<view class="none">
					没有更多了~~~
				</view>
			</scroll-view>
		</view>
		<view class="carList" v-if="carListshow">
			<scroll-view scroll-y style="max-height:15rem ;">
				<view class="list" v-for="(item,index) in cartItems" :key='item.id'>
					<view class="detail">
						<view style="width: 100rpx;height: 100rpx;">
							<image mode="center	" :src="item.menuUrl" alt="" />
						</view>
						<view class="text">
							<view class="name">
								{{item.menuName}}
							</view>
							<view class="price">
								{{item.money*item.chooseNum||0}}
							</view>
						</view>
					</view>
					<view style="display: flex;align-items: center;">
						<u-icon name="minus-circle" @click="detelChoose(item,index)" color="#FE9A00" size="19"></u-icon>
						<text slot="input" style="width: 50px;text-align: center;" class="input">{{item.chooseNum}}</text>
						<u-icon name="plus-circle-fill" @click="addchooseNum(item)" color="#FE9A00" size="19"></u-icon>
					</view>
				</view>
			</scroll-view>
			<u-empty mode="car" iconSize='70' height='120' width='120' v-if='cartItems.length==0' icon="http://cdn.uviewui.com/uview/empty/car.png">
			</u-empty>
			<view style="height: 5.8rem;">
			</view>
		</view>
		<view class="shoppingCart active" ref="cartIcon">
			<image class="shopImg" @click="carListshow=!carListshow" src="http://211.149.132.103:7029//files/20240621/9fa4d9c3404e4e5fbd85893e7864fc3d.png"
			 mode="">
			</image>
			<view class="num">
				<span>￥</span>{{total}}
			</view>
			<view :class="total>0?'settlement':'nosettlement'">
				{{total>0?'去结算':'请选购'}}
			</view>
		</view>
		<!-- 动画元素 -->
		<view v-for="(item, index) in flyItems" :key="item.id" :style="{top: `${item.style.top}px`,left: `${item.style.left}px`,animation: `flyToCart 1s cubic-bezier(0.02,-0.07, 0.43, 1.2) forwards`, '--end-x': `${item.style.endX}px`,'--end-y': `${item.style.endY}px`}"
		 class="fly-item">
		</view>
	</view>
</template>
<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				active: 0,
				startX: 0,
				startY: 0,
				endX: 0,
				endY: 0,
				anims: [],
				cartItems: [],
				total: 0,
				flyItems: [],
				carListshow: false,
				scrollintoview: '',
				vue_all_list: [],
				dataForm: {},
				options: [],
				foodList: []
			}
		},
		onShow() {
			this.getOption()
		},
		methods: {
			async getOption() {
				await request('/ys_menus/getOption', 'get')
					.then(res => {
						if (res.code != 200) {
							return uni.showToast({
								title: res.msg,
								icon: 'error'
							})
						}
						this.options = res.data
						this.getFoodList()
					})
			},
			async getFoodList() {
				await request('/ys_menus/pageList', 'get', this.dataForm)
					.then(res => {
						if (res.code != 200) {
							return uni.showToast({
								title: res.msg,
								icon: 'error'
							})
						}
						this.foodList = []
						this.options.forEach((x) => {
							x.children = []
							res.data.records.forEach((k) => {
								if (x.value === k.menuType) {
									x.children.push(k)
								}
							})
						})
						this.foodList = this.options
						this.list_data_left_api()
					})
			},
			addchooseNum(x) {
				x.chooseNum++
				this.getTotal()
			},
			detelChoose(x, i) {
				if (x.chooseNum == 1) {
					this.cartItems.splice(i, 1)
				} else {
					x.chooseNum--
				}
				this.getTotal()
			},
			// 获取总金额
			getTotal() {
				this.total = this.cartItems.reduce((prev, curr) => {
					const value = Number(curr.money * curr.chooseNum) || 0;
					return prev + value;
				}, 0)
			},
			// 添加购物车
			addList(x, scope, event) {
				let view = uni.createSelectorQuery().in(this).select("." + scope);
				view
					.boundingClientRect((data) => {
						const startX = data.left;
						const startY = data.top;
						// const endX = this.endX;
						// const endY = this.endY;
						let view2 = uni.createSelectorQuery().in(this).select(".shopImg");
						view2
							.boundingClientRect((shopImg) => {
								const endX = shopImg.left - startX + 18;
								const endY = shopImg.top - startY + 18;
								const id = new Date().getTime(); // 使用时间戳作为唯一ID
								const flyItem = {
									id,
									style: {
										left: startX,
										'endX': `${endX}`,
										'endY': `${endY}`,
										top: startY,
									}
								};
								this.flyItems.push(flyItem);
								setTimeout(() => {
									// 动画结束后移除动画元素
									this.flyItems = this.flyItems.filter(item => item.id !== id);
									let a = this.cartItems.find(function(item) {
										return item.value == x.value
									})
									if (a) {
										a.chooseNum++
									} else {
										x.chooseNum = 1
										this.cartItems.push(x)
									}
									this.getTotal()
								}, 1000); // 动画持续时间为1秒
							})
							.exec();
					})
					.exec();


			},
			list_data_left_api() {
				var that = this
				setTimeout(function() {
					uni.createSelectorQuery().selectAll('.main-item').fields({
						id: true,
						dataset: true,
						rect: true,
					}).exec(res => {
						that.vue_all_list = res[0]
					})


					uni.createSelectorQuery().selectAll('.shopImg').fields({
						id: true,
						dataset: true,
						rect: true,
					}).exec(res => {
						if (res[0]) {
							this.endX = res[0].left + 39
							this.endY = res[0].top + 39
						}
					})

				}, 300)
			},
			myonPageScroll(e) {
				var num = e.currentTarget.offsetTop + e.detail.scrollTop
				var ww = this.vue_all_list.find(
					v => v.top >= num
				)
				if (!ww) return
				let id = ww.id.replace('box', '')
				if (this.active != id && id) {
					this.active = id
				}
			},
			changeActive(x) {
				this.active = x.value
				this.scrollintoview = `box${x.value}`
			}
		}
	}
</script>
<style>
	@keyframes flyToCart {
		0% {
			transform: translate(0, 0);
			opacity: 1;
		}

		100% {
			transform: translate(var(--end-x), var(--end-y));
			opacity: 0;
		}
	}

	.fly-item {
		position: absolute;
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		background-color: #FE9A00;
		/* 你可以根据需要设置样式 */
		z-index: 9999;
		opacity: 0;
	}
</style>
<style lang="less" scoped>
	.order {
		display: flex;

		.listType {
			width: 160rpx;
			background: #efefef;
			text-align: center;

			.typeName {
				padding: 20rpx;
			}

			.active {
				background: #fff;
			}
		}

		.foodList {
			flex: 1;
			padding: 20rpx;
		}

		.none {
			height: 400rpx;
			text-align: center;
			color: #999;
			margin-top: 40rpx;
			font-size: 28rpx;
		}

		.commodity {
			display: flex;
			justify-content: space-between;
			width: 100%;
			margin-bottom: 15rpx;
			align-items: center;

			.img {
				display: flex;

				image {
					width: 100%;
					height: 100%;
				}

				.text {
					margin-left: 15rpx;
					font-size: 20rpx;
					width: 100%;

					.dishName {
						font-weight: 500;
						font-size: 28rpx
					}

					.description {
						margin-top: 15rpx;
						color: #999;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						/* 控制显示的行数 */
						overflow: hidden;
					}
				}
			}

			.num {
				color: #999;
				margin-top: 15rpx;
				font-size: 22rpx;

				span {
					color: #329532;
				}
			}
		}
	}

	.pages {
		position: relative;
	}

	.shoppingCart {
		position: fixed;
		bottom: 40rpx;
		background: #3C3839;
		width: 95%;
		margin: 0 auto;
		display: flex;
		left: 22rpx;
		color: #999;
		justify-content: space-between;
		align-items: center;
		border-radius: 80rpx;



		.shopImg {
			width: 150rpx;
			height: 150rpx;
			position: absolute;
			left: 0;
			bottom: 0;
		}

		.num {
			margin-left: 150rpx;
			font-size: 40rpx;

			span {
				font-size: 26rpx
			}
		}

		.settlement {
			background: #797778;
			padding: 20rpx 80rpx;
			border-radius: 80rpx;
		}

		.nosettlement {
			background: #797778;
			padding: 20rpx 80rpx;
			border-radius: 80rpx;
		}

	}

	.carList {
		color: #000;
		padding: 0.6rem;
		position: fixed;
		bottom: 0;
		width: 100%;
		box-sizing: border-box;
		background: #fff;

		.list {
			display: flex;
			justify-content: space-between;
			margin-bottom: 0.5rem;

			.detail {
				display: flex;
				align-items: center;

				.text {
					margin-left: 0.2rem;

					.price {
						color: orange;
					}
				}

				image {
					width: 100rpx;
					height: 100rpx;
				}
			}
		}
	}

	.shoppingCart.active {
		color: #fff !important;

		.settlement {
			background: #FE9A00;
		}
	}
</style>
