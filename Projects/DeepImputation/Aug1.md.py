#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
from ImputeUtil import *
from DataUtil import AugDatasetMasked

co = mu.CmdOptions()                             
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)
ds = AddMissing(ds, 0.5, co.job)

co.CompactNet = 3, 0*[150], 0.005, 0.85
co.DeepNet    = 3, 3*[150], 0.005, 0.85
augDim, netCfg, md.r0, md.decay = co.CompactNet

#=========================================================================

md.InitModel(ds.xDim, ds.xDim)
md.top = None

with tf.name_scope('Decode'):
    augVar1 = md.AddAugment(aDim=2)
    augVar2 = md.AddAugment(aDim=1)

    md.AddLayers(netCfg)
    md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
    md.cost = md.SquaredCost(md.Label()*md.Output(), md.Input())
    
ds2 = AugDatasetMasked(ds, md, [augVar1, augVar2])

# Build a decode sub-graph: augmentation->data patterns
decodeHod = tf.placeholder( tf.float32, shape=[None, ds2.augDim], name="AugmentHolder")
md.top = decoded = AddSection(decodeHod, 'Decode', tf.nn.sigmoid)

#=============================================================================
# A: Train the decode part
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

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpochCallA)

md.modelInfo.update({'Algorithm':'AugmentedImputation', 
    'netCfg':netCfg, 'epochs':co.epochs, 'ImputeError':imputeError})
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
