package com.vfitai.qa.tests;

import com.google.gson.*;
import com.vfitai.qa.base.BaseTest;
import com.vfitai.qa.pages.*;
import com.vfitai.qa.utils.ApiClient;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import org.testng.Assert;
import org.testng.annotations.*;
import java.time.Duration;

/** Real UI writes + real Express/MongoDB readback, isolated before every invocation. */
public class BusinessE2ETests extends BaseTest {
    private String loginCustomer() throws Exception {
        var login = new LoginPage(driver).open(environment.ui()); var account = environment.customer();
        login.submit(account.get("email").getAsString(), account.get("password").getAsString()); login.awaitHome(environment.ui());
        Assert.assertTrue(login.hasSession()); return login.sessionToken();
    }
    private String roleToken(ApiClient api, String role) throws Exception {
        return api.login(environment.data().getAsJsonObject("accounts").getAsJsonObject(role));
    }
    private CheckoutPage prepareCheckout(ApiClient api, String token) throws Exception {
        Assert.assertEquals(api.addAddress(token).status(), 200, "Address fixture setup");
        new ProductPage(driver).openFromHome(environment.ui()).addMedium();
        var cart = new CartPage(driver).open(environment.ui()); cart.selectAll(); cart.checkout();
        return new CheckoutPage(driver);
    }
    private JsonObject newOrder(ApiClient api, String token) throws Exception {
        var orders = api.orders(token); Assert.assertEquals(orders.size(), 3, "Exactly one new order after UI submission");
        var ids = environment.data().getAsJsonObject("fixture").getAsJsonObject("ids");
        for (var element : orders) {
            var order = element.getAsJsonObject(); String id = order.get("_id").getAsString();
            if (!id.equals(ids.get("processingOrder").getAsString()) && !id.equals(ids.get("deliveredOrder").getAsString())) return order;
        }
        throw new AssertionError("UI submission did not create an order");
    }
    private JsonObject createUiOrder(ApiClient api, String token, String shipping, String coupon, long expected) throws Exception {
        var checkout = prepareCheckout(api, token); checkout.shipping(shipping);
        if (!coupon.isEmpty()) checkout.coupon(coupon);
        Assert.assertEquals(checkout.total(), expected, "Displayed checkout total"); checkout.placeOrder();
        new OrdersPage(driver).awaitList();
        return newOrder(api, token);
    }
    @DataProvider(name = "checkoutTotals")
    public Object[][] checkoutTotals() { return new Object[][] {{"standard", "", 230000L}, {"express", "", 250000L}, {"standard", "GIAM10", 210000L}}; }
    @Test(groups = {"e2e", "regression", "orders"}, dataProvider = "checkoutTotals")
    public void uiCheckoutPersistsServerTotalsAndStock(String shipping, String coupon, long expected) throws Exception {
        String token = loginCustomer(); var api = new ApiClient(environment);
        Assert.assertEquals(api.mediumStock(), 5);
        var order = createUiOrder(api, token, shipping, coupon, expected); String id = order.get("_id").getAsString();
        Assert.assertEquals(order.get("totalAmount").getAsLong(), expected);
        Assert.assertEquals(order.get("shippingMethod").getAsString(), shipping);
        Assert.assertEquals(order.get("shippingFee").getAsLong(), shipping.equals("express") ? 50000L : 30000L);
        Assert.assertEquals(order.get("discountAmount").getAsLong(), coupon.isEmpty() ? 0L : 20000L);
        Assert.assertEquals(order.get("paymentMethod").getAsString(), "COD");
        Assert.assertEquals(order.get("status").getAsString(), "Đang xử lý");
        var product = order.getAsJsonArray("products").get(0).getAsJsonObject();
        Assert.assertEquals(order.getAsJsonArray("products").size(), 1);
        Assert.assertEquals(product.get("productId").getAsInt(), 50101); Assert.assertEquals(product.get("price").getAsLong(), 200000L);
        Assert.assertEquals(product.get("quantity").getAsInt(), 1); Assert.assertEquals(product.get("size").getAsString(), "M");
        Assert.assertEquals(api.mediumStock(), 4, "MongoDB-backed stock readback after reservation");
        if (!coupon.isEmpty()) {
            var usage = api.request("GET", "/api/used-coupons", token, null);
            Assert.assertEquals(usage.status(), 200); Assert.assertTrue(usage.body().getAsJsonObject().getAsJsonArray("coupons").contains(new JsonPrimitive(coupon)));
        }
        Assert.assertEquals(api.orders(roleToken(api, "other")).size(), 0, "Other account must not see customer orders");
        driver.navigate().refresh(); var page = new OrdersPage(driver); page.awaitStatus(id, "Đang xử lý");
        Assert.assertTrue(page.text(id).replaceAll("[^0-9]", "").contains(Long.toString(expected)), "Saved total must render after reload");
    }
    @Test(groups = {"e2e", "regression", "orders"})
    public void ownerCancellationPersistsAndRestoresStock() throws Exception {
        String token = loginCustomer(); var api = new ApiClient(environment);
        var order = createUiOrder(api, token, "standard", "", 230000L); String id = order.get("_id").getAsString();
        Assert.assertEquals(api.mediumStock(), 4); new OrdersPage(driver).cancel(id);
        Assert.assertEquals(api.order(token, id).get("status").getAsString(), "Đã hủy");
        Assert.assertEquals(api.mediumStock(), 5, "Cancellation releases the actual reserved stock");
        driver.navigate().refresh(); new OrdersPage(driver).awaitStatus(id, "Đã hủy");
    }
    @Test(groups = {"e2e", "regression", "orders", "authorization"})
    public void adminStatusTransitionIsVisibleToOwner() throws Exception {
        String token = loginCustomer(); var api = new ApiClient(environment);
        String id = createUiOrder(api, token, "standard", "", 230000L).get("_id").getAsString();
        Assert.assertEquals(api.request("GET", "/api/virtual-closet", token, null).body().getAsJsonObject().getAsJsonArray("items").size(), 1, "Undelivered order must not enter purchased closet");
        Assert.assertEquals(api.request("PUT", "/api/orders/" + id, token, "{\"status\":\"Đang giao\"}").status(), 403);
        String admin = roleToken(api, "admin");
        Assert.assertEquals(api.request("PUT", "/api/orders/" + id, admin, "{\"status\":\"Đang giao\"}").status(), 200);
        driver.navigate().refresh(); new OrdersPage(driver).awaitStatus(id, "Đang giao");
        Assert.assertEquals(api.request("PUT", "/api/orders/" + id, admin, "{\"status\":\"Đã giao\"}").status(), 200);
        driver.navigate().refresh(); new OrdersPage(driver).awaitStatus(id, "Đã giao");
        Assert.assertEquals(api.order(token, id).get("status").getAsString(), "Đã giao"); Assert.assertEquals(api.mediumStock(), 4);
        var closet = api.request("GET", "/api/virtual-closet", token, null);
        Assert.assertEquals(closet.status(), 200); var items = closet.body().getAsJsonObject().getAsJsonArray("items");
        Assert.assertEquals(items.size(), 2); JsonObject deliveredItem = null;
        for (var item : items) if (item.getAsJsonObject().get("orderId").getAsString().equals(id)) deliveredItem = item.getAsJsonObject();
        Assert.assertNotNull(deliveredItem, "Delivered order must sync to its owner's 3D closet");
        Assert.assertEquals(deliveredItem.get("size").getAsString(), "M");
        Assert.assertEquals(deliveredItem.get("glbUrl").getAsString(), "/models/Ao_Thun_sizeM.glb");
    }
    @Test(groups = {"e2e", "regression", "orders"})
    public void staleCartStockErrorCreatesNoPhantomOrder() throws Exception {
        String token = loginCustomer(); var api = new ApiClient(environment); var checkout = prepareCheckout(api, token);
        // Another real checkout consumes all five M units after the UI cart was built.
        var reserved = api.request("POST", "/api/orders", token, """
            {"products":[{"productId":50101,"quantity":5,"color":"White","size":"M"}],"shippingMethod":"standard","paymentMethod":"COD","shippingInfo":{"fullName":"QA Customer","phone":"0900000000","address":"10 QA Street","city":"Hồ Chí Minh","district":"Quận 1","ward":"Bến Nghé"}}
            """);
        Assert.assertEquals(reserved.status(), 201); Assert.assertEquals(api.mediumStock(), 0);
        checkout.placeOrder(); Assert.assertTrue(checkout.error().toLowerCase().contains("stock"), "Specific backend stock rejection is displayed");
        Assert.assertTrue(driver.getCurrentUrl().endsWith("/checkout/cart"));
        Assert.assertEquals(api.orders(token).size(), 3, "Only the setup reservation exists; no failed UI order");
        Assert.assertEquals(api.mediumStock(), 0);
        Assert.assertEquals(((JavascriptExecutor)driver).executeScript("return JSON.parse(localStorage.getItem('cartItems')||'[]').length"), 1L);
    }
    @Test(groups = {"e2e", "regression", "auth"})
    public void sessionSurvivesReloadAndLogoutGuardsOrders() throws Exception {
        loginCustomer(); driver.navigate().refresh();
        new Header(driver).logout(); Assert.assertFalse(new LoginPage(driver).hasSession());
        driver.get(environment.ui() + "/orders");
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(ExpectedConditions.urlContains("/login"));
        Assert.assertFalse(new LoginPage(driver).hasSession());
    }
    @Test(groups = {"e2e", "regression", "auth"})
    public void invalidStoredSessionIsCleared() throws Exception {
        ((JavascriptExecutor)driver).executeScript("localStorage.setItem('token','invalid-qa-session')");
        driver.navigate().refresh();
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(d -> !new LoginPage(d).hasSession());
        driver.get(environment.ui() + "/orders");
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(ExpectedConditions.urlContains("/login"));
        Assert.assertFalse(new LoginPage(driver).hasSession());
    }
    @Test(groups = {"e2e", "regression", "auth"})
    public void expiredSignedSessionIsRejectedAndCleared() throws Exception {
        String expired = environment.data().getAsJsonObject("testSessions").get("expiredCustomer").getAsString();
        var api = new ApiClient(environment);
        Assert.assertEquals(api.request("GET", "/api/auth/me", expired, null).status(), 401);
        ((JavascriptExecutor)driver).executeScript("localStorage.setItem('token',arguments[0])", expired);
        driver.navigate().refresh();
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(d -> !new LoginPage(d).hasSession());
        driver.get(environment.ui() + "/orders");
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(ExpectedConditions.urlContains("/login"));
        Assert.assertFalse(new LoginPage(driver).hasSession());
    }
    @Test(groups = {"e2e", "regression", "access"})
    public void customerCannotEnterAdminOrReadAdminOrders() throws Exception {
        String token = loginCustomer(); var api = new ApiClient(environment);
        Assert.assertEquals(api.request("GET", "/api/orders", token, null).status(), 403);
        driver.get(environment.ui() + "/admin/orders");
        new WebDriverWait(driver, Duration.ofSeconds(15)).until(ExpectedConditions.urlToBe(environment.ui() + "/"));
        Assert.assertTrue(driver.findElements(By.cssSelector(".adm-sidebar")).isEmpty(), "Customer must not mount admin UI");
    }
    @Test(groups = {"e2e", "regression", "access"})
    public void anonymousCannotEnterAdminOrReadAdminOrders() throws Exception {
        var api = new ApiClient(environment);
        Assert.assertEquals(api.request("GET", "/api/orders", null, null).status(), 401);
        driver.get(environment.ui() + "/admin/orders");
        new WebDriverWait(driver, Duration.ofSeconds(15)).until(ExpectedConditions.urlToBe(environment.ui() + "/login"));
        Assert.assertTrue(driver.findElements(By.cssSelector(".adm-sidebar")).isEmpty());
    }
    @Test(groups = {"e2e", "regression", "access"})
    public void adminCanLoginAndReadOrderManagement() throws Exception {
        var account = environment.data().getAsJsonObject("accounts").getAsJsonObject("admin");
        var login = new LoginPage(driver).open(environment.ui());
        login.submit(account.get("email").getAsString(), account.get("password").getAsString()); login.awaitHome(environment.ui());
        var api = new ApiClient(environment); Assert.assertEquals(api.request("GET", "/api/orders", login.sessionToken(), null).status(), 200);
        driver.get(environment.ui() + "/admin/orders");
        var wait = new WebDriverWait(driver, Duration.ofSeconds(25));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-orders-page h1")));
        wait.until(ExpectedConditions.numberOfElementsToBe(By.cssSelector(".orders-table tbody .order-id"), 2));
        Assert.assertTrue(driver.findElement(By.cssSelector(".admin-orders-page h1")).getText().contains("Quản lý đơn hàng"));
    }
    @DataProvider(name = "searchQueries")
    public Object[][] searchQueries() { return new Object[][] {{"QA Cotton", true}, {"no-such-qa-product-9384", false}}; }
    @Test(groups = {"e2e", "regression", "catalog"}, dataProvider = "searchQueries")
    public void searchReturnsOnlyMatchingProducts(String query, boolean match) {
        new Header(driver).search(query); var wait = new WebDriverWait(driver, Duration.ofSeconds(25));
        By shirt = By.cssSelector(".search-results-page a[href='/product/50101']");
        if (match) wait.until(ExpectedConditions.visibilityOfElementLocated(shirt));
        else wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".search-results-page"), "Không tìm thấy"));
        Assert.assertEquals(!driver.findElements(shirt).isEmpty(), match);
        Assert.assertTrue(driver.findElements(By.cssSelector(".search-results-page a[href='/product/50102']")).isEmpty());
    }
    @DataProvider(name = "categories")
    public Object[][] categories() { return new Object[][] {{"Áo", "50101", "50102"}, {"Quần", "50102", "50101"}}; }
    @Test(groups = {"e2e", "regression", "catalog"}, dataProvider = "categories")
    public void categoryRouteFiltersCatalog(String category, String expectedId, String excludedId) throws Exception {
        driver.get(environment.ui() + "/category/" + java.net.URLEncoder.encode(category, java.nio.charset.StandardCharsets.UTF_8));
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".list-page a[href='/product/" + expectedId + "']")));
        Assert.assertTrue(driver.findElement(By.cssSelector(".list-page-title")).getText().contains(category));
        Assert.assertTrue(driver.findElements(By.cssSelector(".list-page a[href='/product/" + excludedId + "']")).isEmpty());
    }
    @Test(groups = {"e2e", "regression", "cart"})
    public void cartQuantityPersistsThenRemovalPersists() throws Exception {
        loginCustomer();
        new ProductPage(driver).openFromHome(environment.ui()).addMedium();
        var cart = new CartPage(driver).open(environment.ui()); Assert.assertEquals(cart.quantity(), 1); cart.increment();
        driver.navigate().refresh(); Assert.assertEquals(cart.quantity(), 2); cart.remove(); Assert.assertEquals(cart.itemCount(), 0);
        driver.navigate().refresh();
        new WebDriverWait(driver, Duration.ofSeconds(25)).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".cp-empty")));
        Assert.assertEquals(cart.itemCount(), 0);
    }
}
