<template>
	<view class="indent">
		<u-sticky bgColor="#fff">
			<u-tabs :list="list1" lineWidth='30'></u-tabs>
		</u-sticky>
		<u-empty mode="data" icon="http://cdn.uviewui.com/uview/empty/car.png"></u-empty>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				list1: [{
					name: '全部订单',
				}, {
					name: '已完成',
				}, {
					name: '未完成'
				}, {
					name: '已取消'
				}, {
					name: '礼品卡'
				}]
			}

		},

	}
</script>
<style lang="less" scoped>
	.indent {
		/deep/ .u-tabs__wrapper__nav__item {
			padding: 0 28rpx !important
		}
	}
</style>