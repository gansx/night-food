<template>
	<view class="content">
		<lxCoupon :preferential="10" name='免洗碗' information='免除一次洗碗' @onClick="click" />
		<lxCoupon :preferential="10" :status="false" />
	</view>
</template>

<script>
	import lxCoupon from '@/components/lx-coupon/lx-coupon.vue'
	export default {
		components: {
			lxCoupon
		},
		data() {
			return {

			};
		}
	}
</script>

<style lang="less">

</style>
