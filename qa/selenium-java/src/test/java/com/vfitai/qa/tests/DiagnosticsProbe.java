package com.vfitai.qa.tests;
import com.vfitai.qa.base.BaseTest;
import com.vfitai.qa.pages.ProductPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/** Opt-in failure only: verifies screenshots, nonzero exit and cleanup. Never part of smoke. */
public class DiagnosticsProbe extends BaseTest {
    @Test(groups = "diagnostics")
    public void intentionalFailureCapturesEvidence() throws Exception {
        new ProductPage(driver).openFromHome(environment.ui());
        Assert.fail("Intentional diagnostics probe, not an application defect");
    }
}
