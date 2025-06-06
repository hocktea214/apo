// Copyright 2024 CloudDetail
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"github.com/go-logr/zapr"
	"go.uber.org/zap"
	v1 "k8s.io/api/core/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/CloudDetail/apo/backend/config"
	"github.com/CloudDetail/apo/backend/pkg/model/amconfig"
	"github.com/CloudDetail/apo/backend/pkg/model/request"
)

const (
	AuthTypeNone           string = "none"
	AuthTypeServiceAccount string = "serviceAccount"
	AuthTypeKubeConfig     string = "kubeConfig"

	// DefaultKubeConfigPath Default kubeconfig path
	DefaultKubeConfigPath string = "~/.kube/config"

	// DefaultMetaSetting
	DefaultAPONS         string = "apo"
	DefaultCMNAME        string = "apo-victoria-metrics-alert-server-alert-rules-config"
	DefaultAlertRuleFile string = "alert-rules.yaml"
	DefaultAMCMName      string = "apo-alertmanager-config"
	DefaultAMConfigFile  string = "alertmanager.yaml"
	DefaultVCNAME        string = "apo-vector-config"
	DefaultVCConfigFile  string = "aggregator.yaml"
)

var _ Repo = &k8sApi{}

type Repo interface {
	// Sync with K8sAPIServer
	SyncNow() error

	GetAlertRuleConfigFile(alertRuleFile string) (map[string]string, error)
	UpdateAlertRuleConfigFile(configFile string, content []byte) error
	GetVectorConfigFile() (map[string]string, error)
	UpdateVectorConfigFile(content []byte) error

	GetAlertRules(configFile string, filter *request.AlertRuleFilter, pageParam *request.PageParam, syncNow bool) ([]*request.AlertRule, int)
	UpdateAlertRule(configFile string, alertRule request.AlertRule, oldGroup, oldAlert string) error
	AddAlertRule(configFile string, alertRule request.AlertRule) error
	DeleteAlertRule(configFile string, group, alert string) error
	CheckAlertRule(configFile, group, alert string) (bool, error)

	GetAMConfigReceiver(configFile string, filter *request.AMConfigReceiverFilter, pageParam *request.PageParam, syncNow bool) ([]amconfig.Receiver, int)
	AddAMConfigReceiver(configFile string, receiver amconfig.Receiver) error
	UpdateAMConfigReceiver(configFile string, receiver amconfig.Receiver, oldName string) error
	DeleteAMConfigReceiver(configFile string, name string) error

	GetNamespaceList() (*v1.NamespaceList, error)
	GetNamespaceInfo(namespace string) (*v1.Namespace, error)
	GetPodList(namespace string) (*v1.PodList, error)
	GetPodInfo(namespace string, pod string) (*v1.Pod, error)
}

func New(logger *zap.Logger, authType, authFilePath string, setting config.MetadataSettings) (Repo, error) {
	restConfig, err := createRestConfig(authType, authFilePath)
	if err != nil {
		logger.Info("failed to setup kubernetes repository, skip init", zap.Error(err))
		return NoneRepo, nil
	}

	ctrl.SetLogger(zapr.NewLogger(logger))

	cli, err := client.New(restConfig, client.Options{})
	if err != nil {
		return NoneRepo, err
	}

	if len(setting.Namespace) == 0 {
		setting.Namespace = DefaultAPONS
	}
	if len(setting.AlertRuleCMName) == 0 {
		setting.AlertRuleCMName = DefaultCMNAME
	}
	if len(setting.AlertRuleFileName) == 0 {
		setting.AlertRuleFileName = DefaultAlertRuleFile
	}
	if len(setting.AlertManagerCMName) == 0 {
		setting.AlertManagerCMName = DefaultAMCMName
	}
	if len(setting.AlertManagerFileName) == 0 {
		setting.AlertManagerFileName = DefaultAMConfigFile
	}
	if len(setting.VectorCMName) == 0 {
		setting.VectorCMName = DefaultVCNAME
	}
	if len(setting.VectorFileName) == 0 {
		setting.VectorFileName = DefaultVCConfigFile
	}

	api := &k8sApi{
		logger:           logger,
		cli:              cli,
		MetadataSettings: setting,

		Metadata: Metadata{
			AlertRulesMap: map[string]*AlertRules{},
			AMConfigMap:   map[string]*amconfig.Config{},
		},
	}

	api.SyncNow()

	return api, nil
}

type k8sApi struct {
	logger *zap.Logger
	cli    client.Client

	config.MetadataSettings
	Metadata
}
