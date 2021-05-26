#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
from ImputeUtil import *
from DataUtil import AugDatasetMasked

co = mu.CmdOptions()                             
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)

co.SP500 = 150, 0*[150], 2*[150],   0.001, 0.8,     4   # for 500 epochs i. error: ~ 1.20
co.MNIST = 200, 0*[150], 1*[150],   0.003, 0.85,    1
co.DAPL  = 150, 0*[600], 0*[600],   0.001, 0.8,     1
co.TEST =  200, 0*[150], 1*[150],   0.003, 0.95,    1
augDim, netCfg, netCfg2, md.r0, md.decay, epochFactor = co.TEST

ds = AddMissing(ds, 0.5, co.job)
#=========================================================================

md.InitModel(ds.xDim, ds.xDim)
md.top = None

with tf.name_scope('Decode'):
    augVar = md.AddAugment(aDim=augDim)
    md.AddLayers(netCfg)
    md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
    md.cost = md.SquaredCost(md.Label()*md.Output(), md.Input())
    
ds2 = AugDatasetMasked(ds, md, augVar)

with tf.name_scope('Encode'):
    md.top = md.Input()
    md.AddLayers(netCfg2)
    md.AddLayers(ds2.augDim, tf.nn.tanh)
    md.augHod = md.NewHolder([None, ds2.augDim], 'AugHolder')
    cost2 = md.SquaredCost(md.Output(), md.augHod)

#=============================================================================
# Build a parallel missing.data->encoder->decode->imputed.data graph.
#=============================================================================
md.predOut = md.predHod = tf.placeholder( tf.float32, shape=[None, ds.xDim], name='ImputeHolder')
md.predOut = AddSection(md.predOut, 'Encode', tf.nn.tanh)
tf.identity(md.predOut, name='ImputeCode')
md.predOut = AddSection(md.predOut, 'Decode', tf.nn.sigmoid)
tf.identity(md.predOut, name='ImputeOutput')

#=============================================================================
# Build a decode sub-graph: augmentation->data patterns
#=============================================================================

decodeHod = tf.placeholder( tf.float32, shape=[None, ds2.augDim])
decoded = AddSection(decodeHod, 'Decode', tf.nn.sigmoid)

#=============================================================================
# A: Train the decode part
#=============================================================================
md.log.CfgHistogram(3, 'Imputation Error')

def EpochCallA(ep):
    generated = md.sess.run(decoded, {decodeHod:ds2.aug})
    md.log.SetStatus('%d, %d: %f'%(co.job, ep, md.lastError))
    md.log.ExtHistogram(3, MaskedError(ds, generated), co.job)
    return True

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpochCallA)

ds2.SaveAugment(co.modelName)
SaveMiss(ds, co.modelName)

#=============================================================================
# A:  Train the encode part
#=============================================================================
imputeError = 0

def EpochCallB(ep):
    global imputeError
    imputed = md.sess.run(md.predOut, {md.predHod:ds.X})
    imputeError = MaskedError(ds, imputed)
    msg = 'J:%d,:%d, iE:%.3f'%(co.job, ep, imputeError)
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, imputeError, co.job)
    #md.log.ShowMatrix(imputed, view=1, access='r', title='Imputed: %d'%co.job)
    return False 

ds.Y = ds2.aug
md.outputHod = md.augHod
md.SetVar(md.globalStep, 0)
md.cost = cost2
co.epochs *= epochFactor
coolingPeriod = int(0.05 * co.epochs * ds2.N / md.batchSize)
md.learningRate = tf.train.exponential_decay(0.25*md.r0, md.globalStep, coolingPeriod, md.decay)
adam = tf.train.AdamOptimizer(md.learningRate)
md.trainTarget = adam.minimize(md.cost, global_step=md.globalStep)
md.sess.run(tf.variables_initializer(adam.variables()))
md.Train(ds, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCallB)

md.modelInfo.update({'Algorithm':'AugmentedImputation', 
    'netCfg':netCfg, 'netCfg2':netCfg2, 'epochs':co.epochs, 'ImputeError':imputeError})
md.Save(co.modelName)
