#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
from ImputeUtil import *
from DataUtil import AugDatasetMasked

co = mu.CmdOptions()                             
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)
ds = AddMissing(ds, 0.5, co.job)

co.CompactNet = 3, 0*[150], 0.0025, 0.85
co.DeepNet    = 3, 3*[150], 0.005, 0.85
augDim, netCfg, md.r0, md.decay = co.DeepNet

#=========================================================================

md.InitModel(ds.xDim, ds.xDim)
md.top = None

with tf.name_scope('Decode'):
    augDim1, augDim2 = 30, 20
    augV1 = tf.Variable(tf.zeros([augDim1], dtype=tf.float32), trainable=True)
    augV2 = tf.Variable(tf.zeros([augDim2], dtype=tf.float32), trainable=True)
    aV1, aV2 = tf.reshape(augV1, [1, -1]), tf.reshape(augV2, [1, -1])
    augW1 = md.NewMatrix(augDim1, ds.xDim)
    augW2 = md.NewMatrix(augDim2, ds.xDim)
    md.top = tf.matmul(aV1, augW1) + tf.matmul(aV2, augW2)    
    augBias = md.AddBias()
    md.AddFilter(tf.nn.sigmoid)
    md.cost = md.SquaredCost(md.Label()*md.Output(), md.Input())
    
ds2 = AugDatasetMasked(ds, md, [augV1, augV2])

# Build a decode sub-graph: augmentation->data patterns
decodeHod = tf.placeholder( tf.float32, shape=[None, ds2.augDim], name="AugmentHolder")
decoded = tf.matmul(decodeHod, tf.concat([augW1, augW2], axis=0)) + augBias
md.top = decoded = tf.nn.sigmoid(decoded)

#=============================================================================
# Train the decode part
#=============================================================================
md.log.CfgHistogram(3, 'Imputation Error')
md.log.CfgHistogram(4, 'Learning Error')
imputeError = 0.0

def EpochCallA(ep):
    global imputeError
    generated = md.sess.run(decoded, {decodeHod:ds2.aug})
    msg = 'D: %d, %d: %f'%(co.job, ep, md.lastError)
    md.log.SetStatus(msg)
    print(msg)
    imputeError = MaskedError(ds, generated)
    md.log.ExtHistogram(3, imputeError, co.job)
    md.log.ExtHistogram(4, LearningError(ds, generated), co.job)
    return False
tVars = tf.trainable_variables()
if co.job < 2:
    tVars1 = [v for v in tVars if v not in [augV2, augW2]]
    tVars2 = [v for v in tVars if v not in [augV1, augW1]]
else:
    tVars1 = [v for v in tVars if v not in [augV2]]
    tVars2 = [v for v in tVars if v not in [augV1]]

target1 = md.SetAdamOptimizer(co.epochs, ds2.N, tVars1)
target2 = tf.train.AdamOptimizer(md.learningRate).minimize(md.cost, md.globalStep, tVars2)

for md.trainTarget in [target1, target2]:
    md.SetVar(md.globalStep, 0)
    md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCallA)

md.modelInfo.update({'Algorithm':'AugmentedImputation', 
    'netCfg':netCfg, 'epochs':co.epochs, 'ImputeError':imputeError})
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
