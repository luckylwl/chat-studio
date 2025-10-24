import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Switch, Select, Textarea, Alert, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogTitle, DialogDescription } from '@/components/ui';
import {
  ChartBarIcon,
  ServerIcon,
  ClockIcon,
  CpuChipIcon,
  GlobeAltIcon,
  AdjustmentsHorizontalIcon,
  PlayCircleIcon,
  StopCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  CurrencyDollarIcon,
  SignalIcon,
  ShieldCheckIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import {
  conversationRoutingService,
  AIModel,
  RoutingRule,
  ConversationRequest,
  RoutingResult,
  LoadBalancer,
  CircuitBreaker
} from '@/services/conversationRoutingService';

const ConversationRoutingDashboard: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [metrics, setMetrics] = useState(conversationRoutingService.getMetrics());
  const [activeTab, setActiveTab] = useState('overview');
  const [isRouting, setIsRouting] = useState(false);
  const [testRequest, setTestRequest] = useState<Partial<ConversationRequest>>({
    content: '',
    contentType: 'text',
    context: {
      userTier: 'premium',
      messageLength: 0,
      complexity: 'medium',
      language: 'zh',
      region: 'us',
      priority: 'normal'
    }
  });
  const [testResult, setTestResult] = useState<RoutingResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedRule, setSelectedRule] = useState<RoutingRule | null>(null);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setModels(conversationRoutingService.getModels());
    setRules(conversationRoutingService.getRules());
    setLoadBalancers(conversationRoutingService.getLoadBalancers());
    setMetrics(conversationRoutingService.getMetrics());
  };

  const tabs = [
    { id: 'overview', name: '概览', icon: <ChartBarIcon className="h-4 w-4" /> },
    { id: 'models', name: '模型管理', icon: <CpuChipIcon className="h-4 w-4" /> },
    { id: 'rules', name: '路由规则', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
    { id: 'load-balancing', name: '负载均衡', icon: <ServerIcon className="h-4 w-4" /> },
    { id: 'circuit-breakers', name: '熔断器', icon: <ShieldCheckIcon className="h-4 w-4" /> },
    { id: 'testing', name: '路由测试', icon: <BeakerIcon className="h-4 w-4" /> },
    { id: 'analytics', name: '性能分析', icon: <EyeIcon className="h-4 w-4" /> }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'overloaded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'closed': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-red-100 text-red-800';
      case 'half_open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTestRouting = async () => {
    if (!testRequest.content) return;

    setIsRouting(true);
    try {
      const request: ConversationRequest = {
        id: `test_${Date.now()}`,
        userId: 'test_user',
        organizationId: 'test_org',
        conversationId: 'test_conversation',
        content: testRequest.content,
        contentType: testRequest.contentType || 'text',
        context: {
          userTier: testRequest.context?.userTier || 'premium',
          messageLength: testRequest.content.length,
          complexity: testRequest.context?.complexity || 'medium',
          language: testRequest.context?.language || 'zh',
          region: testRequest.context?.region || 'us',
          priority: testRequest.context?.priority || 'normal'
        },
        requirements: {},
        metadata: {
          timestamp: Date.now(),
          retryCount: 0
        }
      };

      const result = await conversationRoutingService.routeConversation(request);
      setTestResult(result);
    } catch (error) {
      console.error('Routing test failed:', error);
    } finally {
      setIsRouting(false);
    }
  };

  const handleAddModel = async () => {
    if (!selectedModel) return;

    try {
      await conversationRoutingService.addModel(selectedModel);
      loadData();
      setShowModelDialog(false);
      setSelectedModel(null);
    } catch (error) {
      console.error('Failed to add model:', error);
    }
  };

  const handleUpdateModel = async (id: string, updates: Partial<AIModel>) => {
    try {
      await conversationRoutingService.updateModel(id, updates);
      loadData();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const handleRemoveModel = async (id: string) => {
    try {
      await conversationRoutingService.removeModel(id);
      loadData();
    } catch (error) {
      console.error('Failed to remove model:', error);
    }
  };

  const handleAddRule = async () => {
    if (!selectedRule) return;

    try {
      await conversationRoutingService.addRule(selectedRule);
      loadData();
      setShowRuleDialog(false);
      setSelectedRule(null);
    } catch (error) {
      console.error('Failed to add rule:', error);
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<RoutingRule>) => {
    try {
      await conversationRoutingService.updateRule(id, updates);
      loadData();
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleRemoveRule = async (id: string) => {
    try {
      await conversationRoutingService.removeRule(id);
      loadData();
    } catch (error) {
      console.error('Failed to remove rule:', error);
    }
  };

  const activeModels = models.filter(m => m.status === 'active');
  const inactiveModels = models.filter(m => m.status !== 'active');
  const activeRules = rules.filter(r => r.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI对话路由与负载均衡</h2>
          <p className="text-gray-600">智能路由系统，优化AI模型调用和负载分配</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant={isRouting ? "default" : "secondary"}>
            {isRouting ? '路由中' : '就绪'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ServerIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">活跃模型</p>
                    <p className="text-2xl font-bold">{activeModels.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BoltIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">路由请求</p>
                    <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均延迟</p>
                    <p className="text-2xl font-bold">{Math.round(metrics.averageLatency)}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">成功率</p>
                    <p className="text-2xl font-bold">
                      {metrics.totalRequests > 0
                        ? `${((metrics.successfulRoutes / metrics.totalRequests) * 100).toFixed(1)}%`
                        : '100%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>模型使用统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.modelUsage).map(([modelId, usage]) => {
                    const model = models.find(m => m.id === modelId);
                    if (!model) return null;

                    const percentage = metrics.totalRequests > 0 ? (usage / metrics.totalRequests) * 100 : 0;

                    return (
                      <div key={modelId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-sm text-gray-600">{usage} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>活跃路由规则</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeRules.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-600">
                          优先级: {rule.priority} | 应用次数: {rule.metadata.appliedCount}
                        </p>
                      </div>
                      <Badge className={getStatusColor('active')}>活跃</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI模型管理</h3>
            <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedModel({
                  name: '',
                  provider: '',
                  type: 'text',
                  capabilities: [],
                  maxTokens: 4096,
                  costPerToken: 0.000001,
                  latency: 1000,
                  reliability: 0.99,
                  status: 'active',
                  region: 'us-east-1',
                  endpoint: ''
                } as any)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加模型
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedModel?.id ? '编辑模型' : '添加模型'}</DialogTitle>
                </DialogHeader>
                {selectedModel && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">模型名称</Label>
                      <Input
                        id="name"
                        value={selectedModel.name}
                        onChange={(e) => setSelectedModel({ ...selectedModel, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider">提供商</Label>
                      <Input
                        id="provider"
                        value={selectedModel.provider}
                        onChange={(e) => setSelectedModel({ ...selectedModel, provider: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">类型</Label>
                      <Select
                        value={selectedModel.type}
                        onValueChange={(value: any) => setSelectedModel({ ...selectedModel, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">文本</SelectItem>
                          <SelectItem value="image">图像</SelectItem>
                          <SelectItem value="voice">语音</SelectItem>
                          <SelectItem value="video">视频</SelectItem>
                          <SelectItem value="multimodal">多模态</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxTokens">最大Token数</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={selectedModel.maxTokens}
                        onChange={(e) => setSelectedModel({ ...selectedModel, maxTokens: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPerToken">每Token成本</Label>
                      <Input
                        id="costPerToken"
                        type="number"
                        step="0.000001"
                        value={selectedModel.costPerToken}
                        onChange={(e) => setSelectedModel({ ...selectedModel, costPerToken: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpoint">API端点</Label>
                      <Input
                        id="endpoint"
                        value={selectedModel.endpoint}
                        onChange={(e) => setSelectedModel({ ...selectedModel, endpoint: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowModelDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddModel}>
                        {selectedModel.id ? '更新' : '添加'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                    <CardDescription>{model.provider}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">类型</p>
                        <p className="font-medium">{model.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">最大Token</p>
                        <p className="font-medium">{model.maxTokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">成本/Token</p>
                        <p className="font-medium">${model.costPerToken.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">延迟</p>
                        <p className="font-medium">{model.latency}ms</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">健康评分</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              model.metadata.healthScore >= 80 ? 'bg-green-500' :
                              model.metadata.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${model.metadata.healthScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{model.metadata.healthScore}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">当前负载</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              model.metadata.currentLoad <= 50 ? 'bg-green-500' :
                              model.metadata.currentLoad <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${model.metadata.currentLoad}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{model.metadata.currentLoad}%</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelDialog(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateModel(model.id, {
                          status: model.status === 'active' ? 'inactive' : 'active'
                        })}
                      >
                        {model.status === 'active' ?
                          <StopCircleIcon className="h-4 w-4" /> :
                          <PlayCircleIcon className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveModel(model.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">路由规则管理</h3>
            <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedRule({
                  name: '',
                  priority: 1,
                  conditions: [],
                  targetModels: [],
                  loadBalancingStrategy: 'round_robin',
                  failoverStrategy: 'retry',
                  isActive: true
                } as any)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加规则
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{selectedRule?.id ? '编辑规则' : '添加规则'}</DialogTitle>
                </DialogHeader>
                {selectedRule && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ruleName">规则名称</Label>
                        <Input
                          id="ruleName"
                          value={selectedRule.name}
                          onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">优先级</Label>
                        <Input
                          id="priority"
                          type="number"
                          value={selectedRule.priority}
                          onChange={(e) => setSelectedRule({ ...selectedRule, priority: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="loadBalancing">负载均衡策略</Label>
                        <Select
                          value={selectedRule.loadBalancingStrategy}
                          onValueChange={(value: any) => setSelectedRule({ ...selectedRule, loadBalancingStrategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round_robin">轮询</SelectItem>
                            <SelectItem value="least_connections">最少连接</SelectItem>
                            <SelectItem value="weighted">加权</SelectItem>
                            <SelectItem value="latency_based">延迟优先</SelectItem>
                            <SelectItem value="cost_optimized">成本优化</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="failover">故障转移策略</Label>
                        <Select
                          value={selectedRule.failoverStrategy}
                          onValueChange={(value: any) => setSelectedRule({ ...selectedRule, failoverStrategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">立即转移</SelectItem>
                            <SelectItem value="retry">重试</SelectItem>
                            <SelectItem value="circuit_breaker">熔断器</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddRule}>
                        {selectedRule.id ? '更新' : '添加'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={rule.isActive ? '' : 'opacity-60'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">优先级 {rule.priority}</Badge>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => handleUpdateRule(rule.id, { isActive: checked })}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">负载均衡</p>
                        <p className="font-medium">{rule.loadBalancingStrategy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">故障转移</p>
                        <p className="font-medium">{rule.failoverStrategy}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">应用次数</p>
                        <p className="font-medium">{rule.metadata.appliedCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">成功率</p>
                        <p className="font-medium">{(rule.metadata.successRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">目标模型</p>
                      <div className="flex flex-wrap gap-2">
                        {rule.targetModels.map((modelId) => {
                          const model = models.find(m => m.id === modelId);
                          return model ? (
                            <Badge key={modelId} variant="secondary">
                              {model.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">条件</p>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {condition.field} {condition.operator} {String(condition.value)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowRuleDialog(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveRule(rule.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="load-balancing" className="space-y-6">
          <h3 className="text-lg font-semibold">负载均衡状态</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loadBalancers.map((lb, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>负载均衡器 #{index + 1}</CardTitle>
                  <CardDescription>策略: {lb.strategy}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {lb.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-gray-600">权重: {lb.weights[model.id] || 50}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">连接数: {lb.currentConnections[model.id] || 0}</p>
                          <Badge className={getStatusColor(model.status)}>
                            {model.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="circuit-breakers" className="space-y-6">
          <h3 className="text-lg font-semibold">熔断器状态</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadBalancers.flatMap(lb =>
              Object.entries(lb.circuitBreakers).map(([modelId, cb]) => {
                const model = models.find(m => m.id === modelId);
                if (!model) return null;

                return (
                  <Card key={modelId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <Badge className={getCircuitBreakerColor(cb.state)}>
                          {cb.state}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">失败次数</p>
                          <p className="font-medium">{cb.failureCount}/{cb.failureThreshold}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">成功次数</p>
                          <p className="font-medium">{cb.successCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">总请求数</p>
                          <p className="font-medium">{cb.metadata.totalRequests.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">总失败数</p>
                          <p className="font-medium">{cb.metadata.totalFailures.toLocaleString()}</p>
                        </div>
                      </div>

                      {cb.state === 'open' && (
                        <Alert>
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          <AlertDescription>
                            熔断器已开启，将在 {Math.max(0, cb.timeout - (Date.now() - cb.lastFailureTime))}ms 后尝试半开
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <p className="text-sm text-gray-600 mb-2">失败率</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${cb.metadata.totalRequests > 0
                                  ? (cb.metadata.totalFailures / cb.metadata.totalRequests) * 100
                                  : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {cb.metadata.totalRequests > 0
                              ? `${((cb.metadata.totalFailures / cb.metadata.totalRequests) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)
            )}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>路由测试</CardTitle>
                <CardDescription>测试不同条件下的路由决策</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testContent">测试内容</Label>
                  <Textarea
                    id="testContent"
                    placeholder="输入要测试的对话内容..."
                    value={testRequest.content}
                    onChange={(e) => setTestRequest({
                      ...testRequest,
                      content: e.target.value,
                      context: {
                        ...testRequest.context!,
                        messageLength: e.target.value.length
                      }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userTier">用户层级</Label>
                    <Select
                      value={testRequest.context?.userTier}
                      onValueChange={(value: any) => setTestRequest({
                        ...testRequest,
                        context: { ...testRequest.context!, userTier: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">免费</SelectItem>
                        <SelectItem value="premium">高级</SelectItem>
                        <SelectItem value="enterprise">企业</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="complexity">复杂度</Label>
                    <Select
                      value={testRequest.context?.complexity}
                      onValueChange={(value: any) => setTestRequest({
                        ...testRequest,
                        context: { ...testRequest.context!, complexity: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleTestRouting}
                  disabled={isRouting || !testRequest.content}
                  className="w-full"
                >
                  {isRouting ? '路由中...' : '开始测试'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>路由结果</CardTitle>
              </CardHeader>
              <CardContent>
                {testResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">路由成功</span>
                      </div>
                      <p className="text-sm text-green-700">{testResult.reason}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">选中的模型</p>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{testResult.selectedModel.name}</p>
                          <p className="text-sm text-gray-600">{testResult.selectedModel.provider}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">置信度</p>
                          <p className="text-lg font-bold text-blue-600">
                            {(testResult.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">预估成本</p>
                          <p className="text-lg font-bold text-green-600">
                            ${testResult.estimatedCost.toFixed(6)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">预估延迟</p>
                        <p className="text-lg font-bold text-orange-600">
                          {testResult.estimatedLatency}ms
                        </p>
                      </div>

                      {testResult.alternativeModels.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">备选模型</p>
                          <div className="mt-1 space-y-2">
                            {testResult.alternativeModels.map((model) => (
                              <div key={model.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{model.name}</span>
                                <Badge variant="outline">{model.provider}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    输入内容并点击测试按钮查看路由结果
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">性能分析</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">成本节省</p>
                    <p className="text-2xl font-bold">${metrics.costSavings.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <SignalIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">负载均衡效率</p>
                    <p className="text-2xl font-bold">{(metrics.loadBalancingEfficiency * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">熔断器激活</p>
                    <p className="text-2xl font-bold">{metrics.circuitBreakerActivations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className="h-8 w-8 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">活跃区域</p>
                    <p className="text-2xl font-bold">{Object.keys(metrics.regionDistribution).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>用户层级分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.tierDistribution).map(([tier, count]) => {
                    const percentage = metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;

                    return (
                      <div key={tier} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{tier}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>区域分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.regionDistribution).map(([region, count]) => {
                    const percentage = metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0;

                    return (
                      <div key={region} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{region}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversationRoutingDashboard;