#=========================================================================
# Estimate imputation error with simple methods.
#=========================================================================
import numpy as np
from sklearn.impute import SimpleImputer
from ImputeUtil import *
from DataUtil import AugDatasetMasked

co = mu.CmdOptions()                             
print('Loading data...')
ds = mu.ModelDataset('+', 'Nul')
print('Adding missing values...\n')
ds = AddMissing(ds, 0.5, co.job)

print('Mean imputation error: %.5f %.5f\n'%(GetMeanError(ds, True), GetMeanError(ds, False) ))

regErr = GetRegressionError(ds)
totalErr = regErr * ds.Weight/100.0
print('Regression imputation error: %.5f (L1:%.2f)\n'%(regErr, totalErr))

ds.X[ ds.Mask == 0 ] = np.nan
impMean = SimpleImputer(copy=True, fill_value=None, missing_values=np.nan, strategy='median', verbose=0)
impMean.fit(ds.X)
pred = impMean.transform(ds.X)
print('Median imputing error: %.5f'%MaskedError(ds, pred))


