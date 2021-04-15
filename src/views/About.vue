<template>
  <v-container>
    		<h1>Purpose</h1>
		<p>
			<strong>Data Analysts</strong> can use this tool to extract Web of Science data and start analysis from here on any appropriate tools. <br><br> Your feedback has shown that this approach accelerates on-demand and custom reporting, this our our response!
		</p>
		
		<h1>Data & Access</h1>
		<p>
			<strong>Data</strong> is provided via '<a href="https://developer.clarivate.com/apis/wos">Web of Science API Expanded</a>' and access is regulated by tokens. If you need one or don't have one yet - you are only few steps away: <br>
				<ol>
					<li>Go to <a href="http://developer.clarivate.com">developer.clarivate.com</a></br></br>
					<li>Login or sign up with your <strong>institutional email</strong> (e.g. xxx@vip.edu)</br></br>
					<li>Register a new 'application'</br></br>
					<li>Request a new Token for <strong>Web of Science API Expanded </strong> as part of your 'application'</br></br>
					<li>Approval process is started and you will be receive approval/rejection notification shortly</br></br> 
				</ol>
		</p>
		
		<h1>Paywall</h1>
		
		<p><strong>Web of Science API Expanded</strong> is accessible only if you are entitled to it by <strong>subscription</strong>. When you request a new token on developer.clarivate.com, our team will validate your eligibility. Account identification happens based on your email address. Get in touch with us on <a href="https://support.clarivate.com/ScientificandAcademicResearch/s/?language=en_US">support.clarivate.com by Chat | Email | Phone</a> </p>
		
		<h1>Releases</h1>
		<p><strong>Versions / Source code</strong> can be downloaded on Github: <a href="https://github.com/Clarivate-SAR/wos-excel-converter/releases">Clarivate SAR - WOS Excel Converter</a>.
		
		
		<h1>Contribution</h1>
		
		<p>If you would like to become contributer to this tool, engage with use on Github and accelerate our response.</p>
		 
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({})
export default class About extends Vue {}
</script>

<style scoped lang="scss">
#wosIcon {
  position: fixed;
  bottom: -30px;
  right: 10px;
}
</style>
