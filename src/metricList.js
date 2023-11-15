exports.podMetric = {
	"pod_cpu":    "round(sum(irate(container_cpu_usage_seconds_total{pod='.$1',image!=''}[5m]))by(namespace,pod,cluster),0.01)",
	"pod_memory_util" : "sum(sum(container_memory_rss{pod='.$1',image!=''})by(cluster,pod,namespace)/sum(container_memory_max_usage_bytes{pod='.$1',image!=''})by(cluster,pod,namespace))by(cluster,pod,namespace)",
	"pod_memory_usage": "round(sum((container_memory_rss{pod='.$1',image!=''}))by(cluster,pod,namespace)/1024/1024,0.01)",
	"pod_memory_total": "round(sum((container_memory_max_usage_bytes{pod='.$1',image!=''}))by(cluster,pod,namespace)/1024/1024,0.01)",
	//1bytes -> 8bps / 1bps -> 0.125bytes / 현재 단위 1kbps -> 125bytes
	"pod_net_bytes_transmitted": "round(sum(irate(container_network_transmit_bytes_total{pod='.$1',interface!~'^(cali.+|tunl.+|dummy.+|kube.+|flannel.+|cni.+|docker.+|veth.+|lo.*)'}[5m]))by(namespace,pod,cluster)/125,0.01)",
	"pod_net_bytes_received":    "round(sum(irate(container_network_receive_bytes_total{pod='.$1',interface!~'^(cali.+|tunl.+|dummy.+|kube.+|flannel.+|cni.+|docker.+|veth.+|lo.*)'}[5m]))by(namespace,pod,cluster)/125,0.01)",
	//container 쿼리문 검증 필요
	"pod_container_cpu":    "round(sum(irate(container_cpu_usage_seconds_total{pod='.$1',container!='',image!=''}[5m]))by(namespace,pod,cluster,container),0.01)",
	"pod_container_memory": "sum(container_memory_rss{pod='.$1',container!='',image!=''})by(cluster,pod,namespace,container)",
	// "container_net_bytes_transmitted": "round(sum(irate(container_network_transmit_bytes_total{pod='.$1',container!='',interface!~'^(cali.+|tunl.+|dummy.+|kube.+|flannel.+|cni.+|docker.+|veth.+|lo.*)'}[5m]))by(namespace,pod,cluster,container)/125,0.01)",
	// "container_net_bytes_received":    "round(sum(irate(container_network_receive_bytes_total{pod='.$1',container!='',interface!~'^(cali.+|tunl.+|dummy.+|kube.+|flannel.+|cni.+|docker.+|veth.+|lo.*)'}[5m]))by(namespace,pod,cluster,container)/125,0.01)",
};

exports.nodeMetric = { //쿼리 수정 필요
	"node_cpu_util":              "100-avg(irate(node_cpu_seconds_total{mode='idle'}[5m]) * on(pod) group_left(node) kube_pod_info)by(node,cluster)*100",
	"node_cpu_usage":             "sum (rate (container_cpu_usage_seconds_total[5m])) by (instance,cluster,node)",
	"node_cpu_total":             "sum(machine_cpu_cores) by (cluster,node)/2",
	"node_memory_util":           "((node_memory_MemTotal_bytes * on(pod) group_left(node) kube_pod_info ) - (node_memory_MemAvailable_bytes * on(pod) group_left(node) kube_pod_info ) ) / (node_memory_MemTotal_bytes * on(pod) group_left(node) kube_pod_info) *100",
	"node_memory_usage":          "((node_memory_MemTotal_bytes * on(pod) group_left(node) kube_pod_info ) - (node_memory_MemFree_bytes* on(pod) group_left(node) kube_pod_info) - (node_memory_Buffers_bytes* on(pod) group_left(node) kube_pod_info) - (node_memory_Cached_bytes* on(pod) group_left(node) kube_pod_info) - (node_memory_SReclaimable_bytes* on(pod) group_left(node) kube_pod_info))/1024/1024",
	"node_memory_total":          "sum(node_memory_MemTotal_bytes * on(pod) group_left(node) kube_pod_info)by(cluster,node)/1024/1024",
	"node_disk_util":             "100- (node_filesystem_avail_bytes{mountpoint='/',fstype!='rootfs'}* on(pod) group_left(node) kube_pod_info) /  (node_filesystem_size_bytes{mountpoint='/',fstype!='rootfs'}* on(pod) group_left(node) kube_pod_info) *100",
	"node_disk_usage":            "((node_filesystem_size_bytes{mountpoint='/',fstype!='rootfs'}* on(pod) group_left(node) kube_pod_info) - (node_filesystem_avail_bytes{mountpoint='/',fstype!='rootfs'}* on(pod) group_left(node) kube_pod_info))/1000/1000",
	"node_disk_total":            "((node_filesystem_size_bytes{mountpoint='/',fstype!='rootfs'})* on(pod) group_left(node) kube_pod_info ) /1000/1000",
	"node_pod_running":           "sum(kubelet_running_pods{node!=''}) by(cluster,node)",
	"node_pod_quota":             "max(kube_node_status_capacity{resource='pods'}) by (node,cluster) unless on (node,cluster) (kube_node_status_condition{condition='Ready',status=~'unknown|false'} > 0)",
	"node_disk_inode_util":       "100 - ((node_filesystem_files_free{mountpoint=`/`}* on(pod) group_left(node) kube_pod_info) / (node_filesystem_files{mountpoint='/'}* on(pod) group_left(node) kube_pod_info) * 100)",
	"node_disk_inode_total":      "(node_filesystem_files{mountpoint='/'}* on(pod) group_left(node) kube_pod_info)",
	"node_disk_inode_usage":      "((node_filesystem_files{mountpoint='/'}* on(pod) group_left(node) kube_pod_info) - (node_filesystem_files_free{mountpoint='/'}* on(pod) group_left(node) kube_pod_info))",
	"node_disk_read_iops":        "(rate(node_disk_reads_completed_total{device=~'vda'}[5m])* on(pod) group_left(node) kube_pod_info)",
	"node_disk_write_iops":       "(rate(node_disk_writes_completed_total{device=~'vda'}[5m])* on(pod) group_left(node) kube_pod_info)",
	"node_disk_read_throughput":  "(irate(node_disk_read_bytes_total{device=~'vda'}[5m])* on(pod) group_left(node) kube_pod_info)",
	"node_disk_write_throughput": "(irate(node_disk_written_bytes_total{device=~'vda'}[5m])* on(pod) group_left(node) kube_pod_info)",
	"node_net_bytes_transmitted": "(irate(node_network_transmit_bytes_total{device='ens3'}[5m])* on(pod) group_left(node) kube_pod_info)/125",
	"node_net_bytes_received":    "(irate(node_network_receive_bytes_total{device='ens3'}[5m])* on(pod) group_left(node) kube_pod_info)/125",
	"node_info":                  "kube_node_info",
};
