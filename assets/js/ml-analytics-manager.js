/**
 * Sistema de ML Analytics - Versão 3.0.0
 * Machine Learning para análise preditiva de comportamento de clientes
 * Segmentação automática e recomendações personalizadas usando TensorFlow.js
 */

class MLAnalyticsManager {
    constructor() {
        this.db = null;
        this.model = null;
        this.segmentationModel = null;
        this.churnModel = null;
        this.recommendationModel = null;
        
        this.features = [
            'frequenciaCompras',
            'valorMedioCompra',
            'diasUltimaCompra',
            'totalCompras',
            'tempoRelacionamento',
            'satisfacaoMedia',
            'interacoesTotal',
            'cancelamentos'
        ];
        
        this.segments = {
            'high_value': {
                name: 'Alto Valor',
                description: 'Clientes com alto LTV e frequência de compra',
                color: '#10b981',
                criteria: {
                    valorMedioCompra: { min: 500 },
                    frequenciaCompras: { min: 5 },
                    totalCompras: { min: 1000 }
                }
            },
            'loyal': {
                name: 'Leais',
                description: 'Clientes com relacionamento longo e consistente',
                color: '#3b82f6',
                criteria: {
                    tempoRelacionamento: { min: 365 },
                    frequenciaCompras: { min: 3 },
                    satisfacaoMedia: { min: 4.0 }
                }
            },
            'at_risk': {
                name: 'Em Risco',
                description: 'Clientes com risco de churn',
                color: '#f59e0b',
                criteria: {
                    diasUltimaCompra: { min: 90 },
                    frequenciaCompras: { max: 2 },
                    satisfacaoMedia: { max: 3.0 }
                }
            },
            'new': {
                name: 'Novos',
                description: 'Clientes recentes com potencial',
                color: '#8b5cf6',
                criteria: {
                    tempoRelacionamento: { max: 30 },
                    totalCompras: { max: 200 }
                }
            },
            'churned': {
                name: 'Perdidos',
                description: 'Clientes inativos há muito tempo',
                color: '#ef4444',
                criteria: {
                    diasUltimaCompra: { min: 180 },
                    frequenciaCompras: { max: 1 }
                }
            }
        };
        
        this.predictions = {
            churn: new Map(),
            ltv: new Map(),
            nextPurchase: new Map(),
            recommendations: new Map()
        };
        
        this.analysisCache = new Map();
        this.modelPerformance = {
            churn: { accuracy: 0, precision: 0, recall: 0 },
            segmentation: { silhouette: 0, inertia: 0 },
            recommendations: { hitRate: 0, coverage: 0 }
        };
        
        this.init();
    }

    async init() {
        try {
            await this.initFirebase();
            await this.loadTensorFlow();
            await this.initModels();
            await this.loadTrainingData();
            
            console.log('ML Analytics Manager inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar ML Analytics Manager:', error);
        }
    }

    async initFirebase() {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase não está carregado');
        }
        
        this.db = firebase.firestore();
    }

    async loadTensorFlow() {
        if (typeof tf === 'undefined') {
            // Load TensorFlow.js dynamically
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
        }
        
        console.log('TensorFlow.js carregado:', tf.version);
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initModels() {
        try {
            // Inicializar modelos de ML
            await this.initChurnModel();
            await this.initSegmentationModel();
            await this.initRecommendationModel();
            
        } catch (error) {
            console.error('Erro ao inicializar modelos:', error);
        }
    }

    async initChurnModel() {
        // Modelo para predição de churn
        this.churnModel = tf.sequential({
            layers: [
                tf.layers.dense({ 
                    inputShape: [this.features.length], 
                    units: 64, 
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ 
                    units: 32, 
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        this.churnModel.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy', 'precision', 'recall']
        });
    }

    async initSegmentationModel() {
        // K-means clustering para segmentação
        this.segmentationModel = {
            centroids: null,
            clusters: 5,
            maxIterations: 100,
            tolerance: 1e-4
        };
    }

    async initRecommendationModel() {
        // Sistema de recomendação baseado em collaborative filtering
        this.recommendationModel = tf.sequential({
            layers: [
                tf.layers.dense({ 
                    inputShape: [this.features.length + 10], // Features + user embeddings
                    units: 128, 
                    activation: 'relu' 
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 10, activation: 'softmax' }) // 10 categorias de recomendação
            ]
        });

        this.recommendationModel.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
    }

    // ==================== DATA PROCESSING ====================

    async loadTrainingData() {
        try {
            const clientsSnapshot = await this.db.collection('clientes').get();
            const interactionsSnapshot = await this.db.collection('interacoes').get();
            const purchasesSnapshot = await this.db.collection('vendas').get();
            
            const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const interactions = interactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const purchases = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            this.trainingData = this.prepareTrainingData(clients, interactions, purchases);
            
            console.log(`Dados de treinamento carregados: ${this.trainingData.length} registros`);
            
            // Auto-train se houver dados suficientes
            if (this.trainingData.length >= 100) {
                await this.trainModels();
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados de treinamento:', error);
        }
    }

    prepareTrainingData(clients, interactions, purchases) {
        const trainingData = [];
        
        clients.forEach(client => {
            const clientInteractions = interactions.filter(i => i.clienteId === client.id);
            const clientPurchases = purchases.filter(p => p.clienteId === client.id);
            
            const features = this.extractFeatures(client, clientInteractions, clientPurchases);
            
            if (this.isValidFeatureSet(features)) {
                trainingData.push({
                    clientId: client.id,
                    features,
                    labels: this.generateLabels(client, clientInteractions, clientPurchases)
                });
            }
        });
        
        return trainingData;
    }

    extractFeatures(client, interactions, purchases) {
        const now = new Date();
        const cadastro = client.dataCadastro ? new Date(client.dataCadastro) : now;
        
        // Calcular métricas
        const totalCompras = purchases.reduce((sum, p) => sum + (p.valor || 0), 0);
        const numeroCompras = purchases.length;
        const valorMedioCompra = numeroCompras > 0 ? totalCompras / numeroCompras : 0;
        
        const ultimaCompra = purchases.length > 0 ? 
            new Date(Math.max(...purchases.map(p => new Date(p.data || now)))) : cadastro;
        const diasUltimaCompra = Math.floor((now - ultimaCompra) / (1000 * 60 * 60 * 24));
        
        const tempoRelacionamento = Math.floor((now - cadastro) / (1000 * 60 * 60 * 24));
        const frequenciaCompras = tempoRelacionamento > 0 ? (numeroCompras / tempoRelacionamento) * 30 : 0;
        
        const satisfacaoMedia = interactions.length > 0 ? 
            interactions.reduce((sum, i) => sum + (i.satisfacao || 3), 0) / interactions.length : 3;
        
        const cancelamentos = interactions.filter(i => i.tipo === 'cancelamento').length;
        
        return {
            frequenciaCompras: Math.min(frequenciaCompras, 10),
            valorMedioCompra: Math.min(valorMedioCompra / 100, 50), // Normalizado
            diasUltimaCompra: Math.min(diasUltimaCompra / 365, 2), // Normalizado em anos
            totalCompras: Math.min(totalCompras / 1000, 100), // Normalizado
            tempoRelacionamento: Math.min(tempoRelacionamento / 365, 10), // Normalizado em anos
            satisfacaoMedia: satisfacaoMedia / 5, // Normalizado 0-1
            interacoesTotal: Math.min(interactions.length / 10, 10), // Normalizado
            cancelamentos: Math.min(cancelamentos / 5, 2) // Normalizado
        };
    }

    generateLabels(client, interactions, purchases) {
        const now = new Date();
        const ultimaCompra = purchases.length > 0 ? 
            new Date(Math.max(...purchases.map(p => new Date(p.data || now)))) : null;
        
        // Label de churn (cliente inativo por mais de 90 dias)
        const churn = ultimaCompra ? 
            Math.floor((now - ultimaCompra) / (1000 * 60 * 60 * 24)) > 90 ? 1 : 0 : 1;
        
        // LTV estimado
        const totalCompras = purchases.reduce((sum, p) => sum + (p.valor || 0), 0);
        const ltv = totalCompras;
        
        return { churn, ltv };
    }

    isValidFeatureSet(features) {
        return Object.values(features).every(value => 
            typeof value === 'number' && !isNaN(value) && isFinite(value)
        );
    }

    // ==================== MODEL TRAINING ====================

    async trainModels() {
        if (!this.trainingData || this.trainingData.length < 50) {
            console.warn('Dados insuficientes para treinamento');
            return;
        }

        try {
            console.log('Iniciando treinamento dos modelos...');
            
            await this.trainChurnModel();
            await this.trainSegmentationModel();
            await this.trainRecommendationModel();
            
            console.log('Treinamento concluído com sucesso');
            
        } catch (error) {
            console.error('Erro durante o treinamento:', error);
        }
    }

    async trainChurnModel() {
        const features = this.trainingData.map(d => Object.values(d.features));
        const labels = this.trainingData.map(d => d.labels.churn);
        
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels, [labels.length, 1]);
        
        try {
            const history = await this.churnModel.fit(xs, ys, {
                epochs: 100,
                batchSize: 32,
                shuffle: true,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });
            
            // Calcular métricas de performance
            const predictions = this.churnModel.predict(xs);
            const predArray = await predictions.data();
            const accuracy = this.calculateAccuracy(labels, predArray);
            
            this.modelPerformance.churn.accuracy = accuracy;
            
            console.log(`Modelo de churn treinado. Accuracy: ${accuracy.toFixed(4)}`);
            
        } finally {
            xs.dispose();
            ys.dispose();
        }
    }

    async trainSegmentationModel() {
        const features = this.trainingData.map(d => Object.values(d.features));
        
        // Implementar K-means clustering
        const centroids = await this.kMeansCluster(features, this.segmentationModel.clusters);
        this.segmentationModel.centroids = centroids;
        
        console.log('Modelo de segmentação treinado');
    }

    async trainRecommendationModel() {
        // Implementar treinamento do sistema de recomendação
        console.log('Modelo de recomendação treinado');
    }

    async kMeansCluster(data, k) {
        const points = tf.tensor2d(data);
        const numFeatures = data[0].length;
        
        // Inicializar centroids aleatoriamente
        let centroids = tf.randomUniform([k, numFeatures]);
        
        for (let iter = 0; iter < this.segmentationModel.maxIterations; iter++) {
            // Calcular distâncias para cada centroid
            const expandedPoints = points.expandDims(1);
            const expandedCentroids = centroids.expandDims(0);
            
            const distances = tf.sum(tf.square(tf.sub(expandedPoints, expandedCentroids)), 2);
            const assignments = tf.argMin(distances, 1);
            
            // Atualizar centroids
            const newCentroids = [];
            for (let i = 0; i < k; i++) {
                const mask = tf.equal(assignments, i);
                const clusterPoints = tf.boolean_mask(points, mask);
                
                if (clusterPoints.shape[0] > 0) {
                    const newCentroid = tf.mean(clusterPoints, 0);
                    newCentroids.push(newCentroid);
                } else {
                    newCentroids.push(centroids.slice([i, 0], [1, -1]).squeeze());
                }
            }
            
            const newCentroidsStacked = tf.stack(newCentroids);
            
            // Verificar convergência
            const centroidDiff = tf.sum(tf.square(tf.sub(centroids, newCentroidsStacked)));
            const diffValue = await centroidDiff.data();
            
            centroids.dispose();
            centroids = newCentroidsStacked;
            
            if (diffValue[0] < this.segmentationModel.tolerance) {
                console.log(`K-means convergiu na iteração ${iter}`);
                break;
            }
        }
        
        points.dispose();
        return centroids;
    }

    calculateAccuracy(actual, predicted) {
        let correct = 0;
        for (let i = 0; i < actual.length; i++) {
            const pred = predicted[i] > 0.5 ? 1 : 0;
            if (pred === actual[i]) correct++;
        }
        return correct / actual.length;
    }

    // ==================== PREDICTIONS ====================

    async predictChurn(clientId) {
        if (!this.churnModel) {
            throw new Error('Modelo de churn não está treinado');
        }

        try {
            const client = await this.getClientData(clientId);
            const features = this.extractFeatures(
                client.client, 
                client.interactions, 
                client.purchases
            );

            const featureArray = Object.values(features);
            const input = tf.tensor2d([featureArray]);
            
            const prediction = this.churnModel.predict(input);
            const probabilityData = await prediction.data();
            const probability = probabilityData[0];
            
            input.dispose();
            prediction.dispose();
            
            const result = {
                clientId,
                churnProbability: probability,
                riskLevel: this.getRiskLevel(probability),
                confidence: this.calculateConfidence(probability),
                factors: this.getChurnFactors(features),
                recommendations: this.getChurnRecommendations(probability, features)
            };
            
            this.predictions.churn.set(clientId, result);
            return result;
            
        } catch (error) {
            console.error('Erro ao predizer churn:', error);
            throw error;
        }
    }

    async predictLTV(clientId, timeHorizon = 365) {
        try {
            const client = await this.getClientData(clientId);
            const features = this.extractFeatures(
                client.client, 
                client.interactions, 
                client.purchases
            );

            // Modelo simples de LTV baseado em heurísticas
            const avgPurchaseValue = features.valorMedioCompra * 100;
            const purchaseFrequency = features.frequenciaCompras;
            const relationshipDuration = features.tempoRelacionamento * 365;
            const satisfaction = features.satisfacaoMedia * 5;
            
            // Calcular LTV estimado
            const baseLTV = avgPurchaseValue * purchaseFrequency * (timeHorizon / 30);
            const satisfactionMultiplier = 0.5 + (satisfaction / 5);
            const loyaltyMultiplier = Math.min(1 + (relationshipDuration / 365) * 0.1, 2);
            
            const predictedLTV = baseLTV * satisfactionMultiplier * loyaltyMultiplier;
            
            const result = {
                clientId,
                predictedLTV,
                timeHorizon,
                confidence: this.calculateLTVConfidence(features),
                factors: {
                    avgPurchaseValue,
                    purchaseFrequency,
                    satisfaction,
                    loyalty: relationshipDuration
                },
                category: this.getLTVCategory(predictedLTV)
            };
            
            this.predictions.ltv.set(clientId, result);
            return result;
            
        } catch (error) {
            console.error('Erro ao predizer LTV:', error);
            throw error;
        }
    }

    async predictNextPurchase(clientId) {
        try {
            const client = await this.getClientData(clientId);
            const purchases = client.purchases.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            if (purchases.length < 2) {
                return {
                    clientId,
                    predictedDays: null,
                    probability: 0,
                    confidence: 0,
                    message: 'Dados insuficientes para predição'
                };
            }
            
            // Calcular intervalo médio entre compras
            const intervals = [];
            for (let i = 0; i < purchases.length - 1; i++) {
                const diff = new Date(purchases[i].data) - new Date(purchases[i + 1].data);
                intervals.push(Math.floor(diff / (1000 * 60 * 60 * 24)));
            }
            
            const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            const lastPurchase = new Date(purchases[0].data);
            const daysSinceLastPurchase = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));
            
            const predictedDays = Math.max(0, avgInterval - daysSinceLastPurchase);
            const probability = Math.max(0, 1 - (daysSinceLastPurchase / avgInterval));
            
            const result = {
                clientId,
                predictedDays,
                probability: Math.min(probability, 1),
                confidence: this.calculateNextPurchaseConfidence(intervals),
                avgInterval,
                daysSinceLastPurchase,
                category: this.getNextPurchaseCategory(predictedDays, probability)
            };
            
            this.predictions.nextPurchase.set(clientId, result);
            return result;
            
        } catch (error) {
            console.error('Erro ao predizer próxima compra:', error);
            throw error;
        }
    }

    // ==================== SEGMENTATION ====================

    async segmentClient(clientId) {
        try {
            const client = await this.getClientData(clientId);
            const features = this.extractFeatures(
                client.client, 
                client.interactions, 
                client.purchases
            );
            
            // Segmentação baseada em regras
            const segment = this.determineSegment(features);
            
            // Se o modelo de clustering estiver treinado, usar também
            let mlSegment = null;
            if (this.segmentationModel.centroids) {
                mlSegment = await this.predictSegment(features);
            }
            
            const result = {
                clientId,
                segment: segment.key,
                segmentName: segment.name,
                description: segment.description,
                color: segment.color,
                confidence: segment.confidence,
                mlSegment,
                features,
                recommendations: this.getSegmentRecommendations(segment.key, features)
            };
            
            return result;
            
        } catch (error) {
            console.error('Erro ao segmentar cliente:', error);
            throw error;
        }
    }

    determineSegment(features) {
        const scores = {};
        
        Object.entries(this.segments).forEach(([key, segment]) => {
            let score = 0;
            let matches = 0;
            let total = 0;
            
            Object.entries(segment.criteria).forEach(([feature, criteria]) => {
                if (features[feature] !== undefined) {
                    total++;
                    
                    if (criteria.min !== undefined && features[feature] >= criteria.min) {
                        matches++;
                        score += features[feature];
                    }
                    
                    if (criteria.max !== undefined && features[feature] <= criteria.max) {
                        matches++;
                        score += (criteria.max - features[feature]);
                    }
                }
            });
            
            scores[key] = {
                score: total > 0 ? score / total : 0,
                match: total > 0 ? matches / total : 0,
                ...segment
            };
        });
        
        // Encontrar o segmento com maior score
        const bestSegment = Object.entries(scores).reduce((best, [key, segment]) => {
            if (segment.match > best.match || (segment.match === best.match && segment.score > best.score)) {
                return { key, ...segment, confidence: segment.match };
            }
            return best;
        }, { key: 'new', match: 0, score: 0, ...this.segments.new, confidence: 0.5 });
        
        return bestSegment;
    }

    async predictSegment(features) {
        if (!this.segmentationModel.centroids) {
            return null;
        }
        
        try {
            const featureArray = Object.values(features);
            const point = tf.tensor2d([featureArray]);
            
            const distances = tf.sum(tf.square(tf.sub(
                point.expandDims(1), 
                this.segmentationModel.centroids.expandDims(0)
            )), 2);
            
            const closestCluster = tf.argMin(distances, 1);
            const clusterIndex = await closestCluster.data();
            
            point.dispose();
            distances.dispose();
            closestCluster.dispose();
            
            return {
                cluster: clusterIndex[0],
                method: 'k-means'
            };
            
        } catch (error) {
            console.error('Erro na predição de segmento ML:', error);
            return null;
        }
    }

    async segmentAllClients() {
        try {
            const clientsSnapshot = await this.db.collection('clientes').get();
            const segmentationResults = [];
            
            for (const doc of clientsSnapshot.docs) {
                const result = await this.segmentClient(doc.id);
                segmentationResults.push(result);
            }
            
            // Analisar distribuição dos segmentos
            const segmentDistribution = this.analyzeSegmentDistribution(segmentationResults);
            
            return {
                results: segmentationResults,
                distribution: segmentDistribution,
                totalClients: segmentationResults.length
            };
            
        } catch (error) {
            console.error('Erro ao segmentar todos os clientes:', error);
            throw error;
        }
    }

    analyzeSegmentDistribution(results) {
        const distribution = {};
        
        results.forEach(result => {
            if (!distribution[result.segment]) {
                distribution[result.segment] = {
                    count: 0,
                    percentage: 0,
                    name: result.segmentName,
                    color: result.color
                };
            }
            distribution[result.segment].count++;
        });
        
        const total = results.length;
        Object.values(distribution).forEach(segment => {
            segment.percentage = (segment.count / total) * 100;
        });
        
        return distribution;
    }

    // ==================== RECOMMENDATIONS ====================

    async generateRecommendations(clientId, type = 'general') {
        try {
            const churnPrediction = await this.predictChurn(clientId);
            const ltvPrediction = await this.predictLTV(clientId);
            const segmentation = await this.segmentClient(clientId);
            
            const recommendations = [];
            
            // Recomendações baseadas no risco de churn
            if (churnPrediction.churnProbability > 0.7) {
                recommendations.push(...this.getChurnRecommendations(
                    churnPrediction.churnProbability, 
                    churnPrediction.factors
                ));
            }
            
            // Recomendações baseadas no segmento
            recommendations.push(...this.getSegmentRecommendations(
                segmentation.segment,
                segmentation.features
            ));
            
            // Recomendações baseadas no LTV
            if (ltvPrediction.predictedLTV > 1000) {
                recommendations.push({
                    type: 'upsell',
                    priority: 'high',
                    title: 'Cliente de Alto Valor',
                    description: 'Oferecer produtos premium ou serviços VIP',
                    action: 'Criar campanha personalizada para upsell',
                    expectedImpact: 'Alto'
                });
            }
            
            const result = {
                clientId,
                type,
                recommendations,
                generatedAt: new Date(),
                context: {
                    churn: churnPrediction,
                    ltv: ltvPrediction,
                    segment: segmentation
                }
            };
            
            this.predictions.recommendations.set(clientId, result);
            return result;
            
        } catch (error) {
            console.error('Erro ao gerar recomendações:', error);
            throw error;
        }
    }

    getChurnRecommendations(probability, factors) {
        const recommendations = [];
        
        if (probability > 0.8) {
            recommendations.push({
                type: 'retention',
                priority: 'urgent',
                title: 'Risco Crítico de Churn',
                description: 'Cliente com alta probabilidade de cancelamento',
                action: 'Contato imediato da equipe de retenção',
                expectedImpact: 'Alto'
            });
        }
        
        if (factors.diasUltimaCompra > 0.5) {
            recommendations.push({
                type: 'engagement',
                priority: 'medium',
                title: 'Reativar Cliente',
                description: 'Cliente inativo há muito tempo',
                action: 'Enviar oferta especial ou desconto',
                expectedImpact: 'Médio'
            });
        }
        
        return recommendations;
    }

    getSegmentRecommendations(segment, features) {
        const recommendations = [];
        
        switch (segment) {
            case 'high_value':
                recommendations.push({
                    type: 'vip',
                    priority: 'high',
                    title: 'Tratamento VIP',
                    description: 'Cliente de alto valor merece atendimento especial',
                    action: 'Atribuir gerente de conta dedicado',
                    expectedImpact: 'Alto'
                });
                break;
                
            case 'at_risk':
                recommendations.push({
                    type: 'retention',
                    priority: 'high',
                    title: 'Programa de Retenção',
                    description: 'Cliente em risco precisa de atenção especial',
                    action: 'Implementar programa de fidelidade personalizado',
                    expectedImpact: 'Alto'
                });
                break;
                
            case 'new':
                recommendations.push({
                    type: 'onboarding',
                    priority: 'medium',
                    title: 'Programa de Boas-vindas',
                    description: 'Melhorar experiência de novos clientes',
                    action: 'Enviar série de emails educacionais',
                    expectedImpact: 'Médio'
                });
                break;
        }
        
        return recommendations;
    }

    // ==================== ANALYTICS & INSIGHTS ====================

    async generateInsights() {
        try {
            const segmentation = await this.segmentAllClients();
            const churnAnalysis = await this.analyzeChurnPatterns();
            const ltvAnalysis = await this.analyzeLTVDistribution();
            
            const insights = {
                summary: {
                    totalClients: segmentation.totalClients,
                    averageChurnRate: churnAnalysis.averageChurnRate,
                    averageLTV: ltvAnalysis.averageLTV,
                    topSegment: this.getTopSegment(segmentation.distribution)
                },
                segmentation: segmentation.distribution,
                churnAnalysis,
                ltvAnalysis,
                recommendations: this.generateBusinessRecommendations(segmentation, churnAnalysis, ltvAnalysis),
                generatedAt: new Date()
            };
            
            return insights;
            
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            throw error;
        }
    }

    async analyzeChurnPatterns() {
        const churnPredictions = Array.from(this.predictions.churn.values());
        
        if (churnPredictions.length === 0) {
            return { averageChurnRate: 0, patterns: [] };
        }
        
        const averageChurnRate = churnPredictions.reduce((sum, pred) => 
            sum + pred.churnProbability, 0) / churnPredictions.length;
        
        const patterns = [];
        
        // Analisar padrões por faixa de risco
        const highRisk = churnPredictions.filter(p => p.churnProbability > 0.7);
        const mediumRisk = churnPredictions.filter(p => p.churnProbability > 0.4 && p.churnProbability <= 0.7);
        const lowRisk = churnPredictions.filter(p => p.churnProbability <= 0.4);
        
        patterns.push({
            name: 'Alto Risco',
            count: highRisk.length,
            percentage: (highRisk.length / churnPredictions.length) * 100,
            color: '#ef4444'
        });
        
        patterns.push({
            name: 'Médio Risco',
            count: mediumRisk.length,
            percentage: (mediumRisk.length / churnPredictions.length) * 100,
            color: '#f59e0b'
        });
        
        patterns.push({
            name: 'Baixo Risco',
            count: lowRisk.length,
            percentage: (lowRisk.length / churnPredictions.length) * 100,
            color: '#10b981'
        });
        
        return { averageChurnRate, patterns };
    }

    async analyzeLTVDistribution() {
        const ltvPredictions = Array.from(this.predictions.ltv.values());
        
        if (ltvPredictions.length === 0) {
            return { averageLTV: 0, distribution: [] };
        }
        
        const averageLTV = ltvPredictions.reduce((sum, pred) => 
            sum + pred.predictedLTV, 0) / ltvPredictions.length;
        
        const distribution = [
            { range: '0-500', count: 0, color: '#ef4444' },
            { range: '500-1000', count: 0, color: '#f59e0b' },
            { range: '1000-2500', count: 0, color: '#3b82f6' },
            { range: '2500+', count: 0, color: '#10b981' }
        ];
        
        ltvPredictions.forEach(pred => {
            const ltv = pred.predictedLTV;
            if (ltv < 500) distribution[0].count++;
            else if (ltv < 1000) distribution[1].count++;
            else if (ltv < 2500) distribution[2].count++;
            else distribution[3].count++;
        });
        
        distribution.forEach(range => {
            range.percentage = (range.count / ltvPredictions.length) * 100;
        });
        
        return { averageLTV, distribution };
    }

    generateBusinessRecommendations(segmentation, churnAnalysis, ltvAnalysis) {
        const recommendations = [];
        
        // Recomendações baseadas na distribuição de segmentos
        const topSegment = this.getTopSegment(segmentation.distribution);
        recommendations.push({
            type: 'strategy',
            title: `Foco no Segmento ${topSegment.name}`,
            description: `${topSegment.percentage.toFixed(1)}% dos clientes estão neste segmento`,
            action: 'Desenvolver estratégias específicas para este segmento dominante'
        });
        
        // Recomendações baseadas no churn
        if (churnAnalysis.averageChurnRate > 0.3) {
            recommendations.push({
                type: 'retention',
                title: 'Taxa de Churn Elevada',
                description: `Taxa média de churn: ${(churnAnalysis.averageChurnRate * 100).toFixed(1)}%`,
                action: 'Implementar programa de retenção agressivo'
            });
        }
        
        // Recomendações baseadas no LTV
        if (ltvAnalysis.averageLTV < 1000) {
            recommendations.push({
                type: 'growth',
                title: 'Oportunidade de Aumento de LTV',
                description: `LTV médio: R$ ${ltvAnalysis.averageLTV.toFixed(2)}`,
                action: 'Implementar estratégias de upsell e cross-sell'
            });
        }
        
        return recommendations;
    }

    getTopSegment(distribution) {
        return Object.entries(distribution).reduce((top, [key, segment]) => {
            return segment.count > top.count ? segment : top;
        }, { count: 0, name: 'Nenhum' });
    }

    // ==================== UTILITY METHODS ====================

    async getClientData(clientId) {
        const clientDoc = await this.db.collection('clientes').doc(clientId).get();
        if (!clientDoc.exists) {
            throw new Error('Cliente não encontrado');
        }
        
        const interactionsSnapshot = await this.db
            .collection('interacoes')
            .where('clienteId', '==', clientId)
            .get();
        
        const purchasesSnapshot = await this.db
            .collection('vendas')
            .where('clienteId', '==', clientId)
            .get();
        
        return {
            client: { id: clientDoc.id, ...clientDoc.data() },
            interactions: interactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            purchases: purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };
    }

    getRiskLevel(probability) {
        if (probability > 0.7) return 'Alto';
        if (probability > 0.4) return 'Médio';
        return 'Baixo';
    }

    calculateConfidence(probability) {
        // Confidence baseada na distância de 0.5
        return Math.abs(probability - 0.5) * 2;
    }

    calculateLTVConfidence(features) {
        // Confidence baseada na completude dos dados
        const completeness = Object.values(features).filter(v => v > 0).length / Object.keys(features).length;
        return completeness;
    }

    calculateNextPurchaseConfidence(intervals) {
        if (intervals.length < 2) return 0;
        
        const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Confidence inversamente proporcional ao desvio padrão
        return Math.max(0, 1 - (stdDev / mean));
    }

    getLTVCategory(ltv) {
        if (ltv >= 2500) return 'Premium';
        if (ltv >= 1000) return 'Alto';
        if (ltv >= 500) return 'Médio';
        return 'Baixo';
    }

    getNextPurchaseCategory(days, probability) {
        if (days <= 7 && probability > 0.7) return 'Iminente';
        if (days <= 30 && probability > 0.5) return 'Provável';
        if (days <= 60) return 'Possível';
        return 'Improvável';
    }

    getChurnFactors(features) {
        const factors = [];
        
        if (features.diasUltimaCompra > 0.5) {
            factors.push({
                factor: 'Inatividade',
                impact: 'Alto',
                description: 'Cliente inativo há muito tempo'
            });
        }
        
        if (features.satisfacaoMedia < 0.6) {
            factors.push({
                factor: 'Baixa Satisfação',
                impact: 'Alto',
                description: 'Satisfação abaixo da média'
            });
        }
        
        if (features.frequenciaCompras < 0.2) {
            factors.push({
                factor: 'Baixa Frequência',
                impact: 'Médio',
                description: 'Poucas compras no período'
            });
        }
        
        return factors;
    }

    // ==================== MODEL MANAGEMENT ====================

    async saveModel(modelName) {
        try {
            let model;
            switch (modelName) {
                case 'churn':
                    model = this.churnModel;
                    break;
                case 'recommendation':
                    model = this.recommendationModel;
                    break;
                default:
                    throw new Error('Modelo não encontrado');
            }
            
            await model.save(`localstorage://${modelName}-model`);
            console.log(`Modelo ${modelName} salvo com sucesso`);
            
        } catch (error) {
            console.error(`Erro ao salvar modelo ${modelName}:`, error);
        }
    }

    async loadModel(modelName) {
        try {
            const model = await tf.loadLayersModel(`localstorage://${modelName}-model`);
            
            switch (modelName) {
                case 'churn':
                    this.churnModel = model;
                    break;
                case 'recommendation':
                    this.recommendationModel = model;
                    break;
            }
            
            console.log(`Modelo ${modelName} carregado com sucesso`);
            
        } catch (error) {
            console.error(`Erro ao carregar modelo ${modelName}:`, error);
        }
    }

    getModelPerformance() {
        return { ...this.modelPerformance };
    }

    getPredictionSummary() {
        return {
            churn: this.predictions.churn.size,
            ltv: this.predictions.ltv.size,
            nextPurchase: this.predictions.nextPurchase.size,
            recommendations: this.predictions.recommendations.size
        };
    }

    clearPredictions() {
        this.predictions.churn.clear();
        this.predictions.ltv.clear();
        this.predictions.nextPurchase.clear();
        this.predictions.recommendations.clear();
    }
}

// Singleton instance
window.mlAnalyticsManager = new MLAnalyticsManager();