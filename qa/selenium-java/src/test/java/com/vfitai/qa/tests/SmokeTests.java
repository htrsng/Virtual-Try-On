package com.vfitai.qa.tests;

import com.vfitai.qa.base.BaseTest;
import com.vfitai.qa.pages.*;
import org.testng.Assert;
import org.testng.annotations.*;

public class SmokeTests extends BaseTest {
    @Test(groups = {"smoke", "regression", "auth"})
    public void customerCanLoginThroughUi() throws Exception {
        var account = environment.customer(); var login = new LoginPage(driver).open(environment.ui());
        login.submit(account.get("email").getAsString(), account.get("password").getAsString());
        login.awaitHome(environment.ui()); Assert.assertTrue(login.hasSession(), "UI login must establish a session");
    }
    @DataProvider(name = "invalidPasswords")
    public Object[][] invalidPasswords() { return new Object[][] {{"wrong-password-123"}, {"another-invalid-password"}}; }
    @Test(groups = {"smoke", "regression", "auth"}, dataProvider = "invalidPasswords")
    public void invalidLoginHasNoSession(String password) throws Exception {
        var login = new LoginPage(driver).open(environment.ui());
        login.submit(environment.customer().get("email").getAsString(), password);
        Assert.assertFalse(login.error().isBlank(), "Rejected login must show an error");
        Assert.assertFalse(login.hasSession(), "Rejected login must not establish a session");
        Assert.assertTrue(driver.getCurrentUrl().endsWith("/login"));
    }
    @Test(groups = {"smoke", "regression", "catalog"})
    public void catalogLinkOpensCorrectProduct() throws Exception {
        Assert.assertEquals(new ProductPage(driver).openFromHome(environment.ui()).title(), "QA Cotton Shirt");
        Assert.assertTrue(driver.getCurrentUrl().endsWith("/product/50101"));
    }
    @Test(groups = {"smoke", "regression", "checkout"})
    public void selectedCartItemReachesCheckout() throws Exception {
        var account = environment.customer(); var login = new LoginPage(driver).open(environment.ui());
        login.submit(account.get("email").getAsString(), account.get("password").getAsString()); login.awaitHome(environment.ui());
        new ProductPage(driver).openFromHome(environment.ui()).addMedium();
        var cart = new CartPage(driver).open(environment.ui());
        Assert.assertFalse(cart.checkoutEnabled(), "No item selected initially");
        cart.selectAll(); Assert.assertTrue(cart.checkoutEnabled()); cart.checkout();
        var summary = new CheckoutPage(driver); String product = summary.selectedProduct();
        Assert.assertEquals(summary.selectedCount(), 1); Assert.assertTrue(product.contains("QA Cotton Shirt"));
        Assert.assertTrue(product.contains("Size M")); Assert.assertTrue(product.contains("x1"));
    }
}
