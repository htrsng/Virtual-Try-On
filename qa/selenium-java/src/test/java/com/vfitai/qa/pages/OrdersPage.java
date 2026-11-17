package com.vfitai.qa.pages;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;

public final class OrdersPage extends BasePage {
    public OrdersPage(WebDriver driver) { super(driver); }
    private By card(String id) {
        if (!id.matches("[a-f0-9]{24}")) throw new IllegalArgumentException("Invalid order id");
        return By.cssSelector("[data-testid='order-" + id + "']");
    }
    public OrdersPage awaitList() { wait.until(ExpectedConditions.urlContains("/orders")); return this; }
    public String text(String id) { return visible(card(id)).getText(); }
    public void awaitStatus(String id, String status) { wait.until(ExpectedConditions.textToBePresentInElementLocated(card(id), status)); }
    public void cancel(String id) {
        click(d -> d.findElement(card(id)).findElement(By.cssSelector("[data-testid='order-expand']")));
        click(d -> d.findElement(card(id)).findElement(By.cssSelector("[data-testid='order-cancel']")));
        wait.until(ExpectedConditions.alertIsPresent()).accept(); awaitStatus(id, "Đã hủy");
    }
}
